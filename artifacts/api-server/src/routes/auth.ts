// Rutas de autenticacion: registro, login, logout y perfil actual
// Usa bcrypt para hashear contrasenas y JWT para sesiones
import { Router } from "express";
import bcrypt from "bcrypt";
import { db } from "@workspace/db";
import { perfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generarToken, requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

// POST /auth/register - Registrar un nuevo usuario (docente o estudiante)
router.post("/auth/register", async (req, res) => {
  try {
    const { nombre, usuario, password, rol, grado_bachillerato } = req.body;

    // Validaciones basicas
    if (!nombre || !usuario || !password || !rol) {
      res.status(400).json({ error: "validation_error", message: "Todos los campos son requeridos" });
      return;
    }

    if (!["estudiante", "docente"].includes(rol)) {
      res.status(400).json({ error: "validation_error", message: "Rol invalido" });
      return;
    }

    // Los estudiantes deben especificar su grado de bachillerato (1, 2 o 3)
    if (rol === "estudiante" && !grado_bachillerato) {
      res.status(400).json({ error: "validation_error", message: "El grado de bachillerato es requerido para estudiantes" });
      return;
    }

    if (rol === "estudiante" && ![1, 2, 3].includes(Number(grado_bachillerato))) {
      res.status(400).json({ error: "validation_error", message: "El grado debe ser 1, 2 o 3" });
      return;
    }

    // Verifica que el nombre de usuario no exista
    const [existente] = await db
      .select({ id: perfilesTable.id })
      .from(perfilesTable)
      .where(eq(perfilesTable.usuario, usuario));

    if (existente) {
      res.status(400).json({ error: "duplicate_user", message: "El nombre de usuario ya esta en uso" });
      return;
    }

    // Hashea la contrasena con bcrypt (10 rounds)
    const password_hash = await bcrypt.hash(password, 10);

    // Crea el perfil en la base de datos
    const [nuevo] = await db
      .insert(perfilesTable)
      .values({
        nombre,
        usuario,
        password_hash,
        rol,
        grado_bachillerato: rol === "estudiante" ? Number(grado_bachillerato) : null,
      })
      .returning();

    // Genera el token JWT
    const token = generarToken({ userId: nuevo.id, usuario: nuevo.usuario, rol: nuevo.rol });

    // Retorna el usuario sin la contrasena
    const { password_hash: _, ...perfil } = nuevo;
    res.status(201).json({ user: perfil, token });
  } catch (err) {
    req.log.error({ err }, "Error en registro");
    res.status(500).json({ error: "server_error", message: "Error interno del servidor" });
  }
});

// POST /auth/login - Iniciar sesion
router.post("/auth/login", async (req, res) => {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      res.status(400).json({ error: "validation_error", message: "Usuario y contrasena son requeridos" });
      return;
    }

    // Busca el usuario por nombre de usuario
    const [perfil] = await db
      .select()
      .from(perfilesTable)
      .where(eq(perfilesTable.usuario, usuario));

    if (!perfil) {
      res.status(401).json({ error: "invalid_credentials", message: "Usuario o contrasena incorrectos" });
      return;
    }

    // Verifica la contrasena con bcrypt
    const valido = await bcrypt.compare(password, perfil.password_hash);
    if (!valido) {
      res.status(401).json({ error: "invalid_credentials", message: "Usuario o contrasena incorrectos" });
      return;
    }

    // Actualiza el ultimo acceso
    await db
      .update(perfilesTable)
      .set({ ultimo_acceso: new Date() })
      .where(eq(perfilesTable.id, perfil.id));

    // Genera el token JWT
    const token = generarToken({ userId: perfil.id, usuario: perfil.usuario, rol: perfil.rol });

    // Retorna el usuario sin la contrasena
    const { password_hash: _, ...perfilPublico } = perfil;
    res.json({ user: perfilPublico, token });
  } catch (err) {
    req.log.error({ err }, "Error en login");
    res.status(500).json({ error: "server_error", message: "Error interno del servidor" });
  }
});

// POST /auth/logout - Cerrar sesion (solo invalida en el cliente)
router.post("/auth/logout", requireAuth, (req, res) => {
  // Con JWT stateless, el logout se maneja en el cliente eliminando el token
  res.json({ success: true, message: "Sesion cerrada exitosamente" });
});

// GET /auth/me - Obtener el usuario actualmente autenticado
router.get("/auth/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [perfil] = await db
      .select()
      .from(perfilesTable)
      .where(eq(perfilesTable.id, req.user!.id));

    if (!perfil) {
      res.status(404).json({ error: "not_found", message: "Usuario no encontrado" });
      return;
    }

    const { password_hash: _, ...perfilPublico } = perfil;
    res.json(perfilPublico);
  } catch (err) {
    req.log.error({ err }, "Error al obtener usuario actual");
    res.status(500).json({ error: "server_error", message: "Error interno del servidor" });
  }
});

export default router;
