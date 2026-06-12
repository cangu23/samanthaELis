// Rutas de autenticacion: registro, login, logout y perfil actual
// Usa bcrypt para hashear contrasenas y JWT para sesiones
import { Router } from "express";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { db } from "@workspace/db";
import { perfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
import { generarToken, requireAuth, type AuthRequest } from "../lib/auth";

function generarToken6(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  for (let i = 0; i < 6; i++) token += chars[Math.floor(Math.random() * chars.length)];
  return token;
}

async function enviarEmailReset(email: string, token: string): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;
  if (!host || !user || !pass) return false;
  try {
    const transporter = nodemailer.createTransport({ host, port: Number(process.env.SMTP_PORT || 587), auth: { user, pass } });
    await transporter.sendMail({
      from: `Cerebrito <${from}>`,
      to: email,
      subject: "Recuperación de contraseña - Cerebrito",
      html: `<div style="font-family:sans-serif;max-width:400px;margin:auto"><h2 style="color:#0EA5E9">Cerebrito</h2><p>Tu código de recuperación de contraseña es:</p><div style="font-size:2rem;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#0f172a;color:#A855F7;border-radius:8px;font-family:monospace">${token}</div><p style="color:#666;font-size:0.875rem">Este código expira en 1 hora. Si no solicitaste este cambio, ignora este correo.</p></div>`,
    });
    return true;
  } catch {
    return false;
  }
}

const router = Router();

// POST /auth/register - Registrar un nuevo usuario (docente o estudiante)
router.post("/auth/register", async (req, res) => {
  try {
    const { nombre, usuario, password, rol, grado_bachillerato, email, cedula } = req.body;

    // Validaciones basicas
    if (!nombre || !usuario || !password || !rol || !cedula) {
      res.status(400).json({ error: "validation_error", message: "Todos los campos son requeridos" });
      return;
    }

    if (rol === "docente") {
      const codigoIngresado = req.body.codigo_docente;
      const codigoCorrecto = process.env.DOCENTE_CODE;
      if (!codigoCorrecto || codigoIngresado !== codigoCorrecto) {
        res.status(403).json({ error: "codigo_invalido", message: "El código de docente es incorrecto" });
        return;
      }
    } else if (rol !== "estudiante") {
      res.status(403).json({ error: "forbidden", message: "Rol no permitido" });
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
      res.status(400).json({ error: "duplicate_user", message: "El nombre de usuario ya está en uso" });
      return;
    }

    // Verifica que la cedula no exista
    const [cedulaExistente] = await db
      .select({ id: perfilesTable.id })
      .from(perfilesTable)
      .where(eq(perfilesTable.cedula, cedula));

    if (cedulaExistente) {
      res.status(400).json({ error: "duplicate_cedula", message: "La cédula ya está registrada" });
      return;
    }

    // Hashea la contrasena con bcrypt (10 rounds)
    const password_hash = await bcrypt.hash(password, 10);

    // Crea el perfil en la base de datos
    const [nuevo] = await db
      .insert(perfilesTable)
      .values({
        nombre,
        cedula,
        usuario,
        password_hash,
        rol,
        grado_bachillerato: rol === "estudiante" ? Number(grado_bachillerato) : null,
        email: email || null,
      })
      .returning();

    // Genera el token JWT
    const token = generarToken({ userId: nuevo.id, usuario: nuevo.usuario, rol: nuevo.rol });

    // Retorna el usuario sin la contrasena
    const { password_hash: _, ...perfil } = nuevo;
    res.status(201).json({ user: perfil, token });
  } catch (err: any) {
    req.log.error({ err }, "Register error");
    res.status(500).json({ 
      error: "server_error", 
      message: err.message 
    });
  }
});

// POST /auth/google - Iniciar sesión o registrarse con Google
router.post("/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) throw new Error("Invalid google token");

    const { sub: googleId, email, name, picture } = payload;

    // 1. Buscar si ya existe por google_id
    let [perfil] = await db
      .select()
      .from(perfilesTable)
      .where(eq(perfilesTable.google_id, googleId));

    // 2. Si no existe, crear uno nuevo (por defecto estudiante)
    if (!perfil) {
      // Verificar si el email ya existe en una cuenta local
      if (email) {
        const [existente] = await db.select().from(perfilesTable).where(eq(perfilesTable.email, email));
        if (existente) {
          // Vincular cuenta existente
          [perfil] = await db.update(perfilesTable).set({ google_id: googleId }).where(eq(perfilesTable.id, existente.id)).returning();
        }
      }

      if (!perfil) {
        [perfil] = await db.insert(perfilesTable).values({
          nombre: name || "Usuario Google",
          cedula: `G-${googleId.substring(0, 10)}`, // Agregamos una cédula temporal basada en Google ID para evitar error de NOT NULL
          usuario: `google_${googleId.substring(0, 8)}`,
          email: email || null,
          google_id: googleId,
          avatar_url: picture || null,
          rol: "estudiante", // Por defecto
          password_hash: "google_authenticated", // No se usa para Google, pero el campo es NOT NULL
          grado_bachillerato: 1, // Por defecto para nuevos usuarios de Google
        }).returning();
      }
    }

    // Actualizar racha y último acceso (copiar lógica de login normal si se desea)
    await db.update(perfilesTable).set({ ultimo_acceso: new Date() }).where(eq(perfilesTable.id, perfil.id));

    const token = generarToken({ userId: perfil.id, usuario: perfil.usuario, rol: perfil.rol });
    const { password_hash: _, ...perfilPublico } = perfil;
    
    res.json({ user: perfilPublico, token });
  } catch (err: any) {
    req.log.error({ err }, "Google login error");
    res.status(500).json({ 
      error: "server_error", 
      message: err.message 
    });
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

    // Calcula la racha de dias consecutivos (ventana de 24 horas)
    const ahora = new Date();
    let nuevaRacha = perfil.racha_dias || 0;

    if (!perfil.ultimo_acceso) {
      // Primera vez que entra
      nuevaRacha = 1;
    } else {
      const diffHoras = (ahora.getTime() - perfil.ultimo_acceso.getTime()) / (1000 * 60 * 60);
      if (diffHoras < 24) {
        // Ya entro hoy, no cambia la racha
        nuevaRacha = perfil.racha_dias;
      } else if (diffHoras < 48) {
        // Entro ayer — dia consecutivo, sube la racha
        nuevaRacha = (perfil.racha_dias || 0) + 1;
      } else {
        // Falto mas de un día — pierde la racha
        nuevaRacha = 1;
      }
    }

    // Actualiza el ultimo acceso y la racha
    await db
      .update(perfilesTable)
      .set({ ultimo_acceso: ahora, racha_dias: nuevaRacha })
      .where(eq(perfilesTable.id, perfil.id));

    // Genera el token JWT
    const token = generarToken({ userId: perfil.id, usuario: perfil.usuario, rol: perfil.rol });

    // Retorna el usuario sin la contrasena (con racha actualizada)
    const { password_hash: _, ...perfilPublico } = perfil;
    res.json({ user: { ...perfilPublico, racha_dias: nuevaRacha }, token });
  } catch (err: any) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ 
      error: "server_error", 
      message: err.message 
    });
  }
});

// POST /auth/forgot-password - Solicitar token de recuperacion de contrasena
router.post("/auth/forgot-password", async (req, res) => {
  try {
    const { cedula } = req.body;
    if (!cedula) { res.status(400).json({ error: "validation_error", message: "Cédula requerida" }); return; }
    const [perfil] = await db.select().from(perfilesTable).where(eq(perfilesTable.cedula, cedula));
    if (!perfil) {
      res.json({ message: "Si la cédula existe, recibirá instrucciones de recuperación" });
      return;
    }
    const token = generarToken6();
    const expiry = new Date(Date.now() + 60 * 60 * 1000);
    await db.update(perfilesTable).set({ reset_token: token, reset_token_expires_at: expiry }).where(eq(perfilesTable.id, perfil.id));
    let emailEnviado = false;
    if (perfil.email) emailEnviado = await enviarEmailReset(perfil.email, token);
    const isDev = process.env.NODE_ENV !== "production";
    res.json({
      message: "Si el usuario existe, recibirá instrucciones de recuperación",
      ...(isDev && { dev_token: token }),
      email_enviado: emailEnviado,
    });
  } catch (err) {
    req.log.error({ err }, "Error en forgot-password");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// POST /auth/reset-password - Cambiar contrasena con token
router.post("/auth/reset-password", async (req, res) => {
  try {
    const { token, nueva_password } = req.body;
    if (!token || !nueva_password) { res.status(400).json({ error: "validation_error", message: "Token y nueva contraseña son requeridos" }); return; }
    if (nueva_password.length < 6) { res.status(400).json({ error: "validation_error", message: "La contraseña debe tener al menos 6 caracteres" }); return; }
    const [perfil] = await db.select().from(perfilesTable).where(eq(perfilesTable.reset_token, token));
    if (!perfil || !perfil.reset_token_expires_at || perfil.reset_token_expires_at < new Date()) {
      res.status(400).json({ error: "invalid_token", message: "El código es inválido o ha expirado" });
      return;
    }
    const hash = await bcrypt.hash(nueva_password, 10);
    await db.update(perfilesTable).set({ password_hash: hash, reset_token: null, reset_token_expires_at: null }).where(eq(perfilesTable.id, perfil.id));
    res.json({ message: "Contraseña actualizada exitosamente" });
  } catch (err) {
    req.log.error({ err }, "Error en reset-password");
    res.status(500).json({ error: "server_error", message: "Error interno" });
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
