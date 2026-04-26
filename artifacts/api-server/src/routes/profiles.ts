// Rutas de perfiles: ver perfiles de usuarios (docentes pueden ver todos)
// Los docentes tienen acceso a ver resultados de los estudiantes
import { Router } from "express";
import { db } from "@workspace/db";
import { perfilesTable, resultadosTable, retosTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireDocente, type AuthRequest } from "../lib/auth";

const router = Router();

// GET /profiles - Obtener todos los perfiles (solo docentes)
router.get("/profiles", requireAuth, requireDocente, async (req, res) => {
  try {
    const perfiles = await db
      .select({
        id: perfilesTable.id,
        nombre: perfilesTable.nombre,
        usuario: perfilesTable.usuario,
        rol: perfilesTable.rol,
        grado_bachillerato: perfilesTable.grado_bachillerato,
        avatar_url: perfilesTable.avatar_url,
        puntos_totales: perfilesTable.puntos_totales,
        retos_completados: perfilesTable.retos_completados,
        racha_dias: perfilesTable.racha_dias,
        ultimo_acceso: perfilesTable.ultimo_acceso,
        creado_en: perfilesTable.creado_en,
        ultimo_nivel_intento: perfilesTable.ultimo_nivel_intento,
        mejor_puntaje_por_modulo: perfilesTable.mejor_puntaje_por_modulo,
      })
      .from(perfilesTable);

    res.json(perfiles);
  } catch (err) {
    req.log.error({ err }, "Error al obtener perfiles");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// GET /profiles/:userId - Obtener un perfil especifico por ID
router.get("/profiles/:userId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = Number(req.params.userId);

    // Los estudiantes solo pueden ver su propio perfil
    if (req.user!.rol === "estudiante" && req.user!.id !== userId) {
      res.status(403).json({ error: "forbidden", message: "No puedes ver el perfil de otro estudiante" });
      return;
    }

    const [perfil] = await db
      .select({
        id: perfilesTable.id,
        nombre: perfilesTable.nombre,
        usuario: perfilesTable.usuario,
        rol: perfilesTable.rol,
        grado_bachillerato: perfilesTable.grado_bachillerato,
        avatar_url: perfilesTable.avatar_url,
        puntos_totales: perfilesTable.puntos_totales,
        retos_completados: perfilesTable.retos_completados,
        racha_dias: perfilesTable.racha_dias,
        ultimo_acceso: perfilesTable.ultimo_acceso,
        creado_en: perfilesTable.creado_en,
        ultimo_nivel_intento: perfilesTable.ultimo_nivel_intento,
        mejor_puntaje_por_modulo: perfilesTable.mejor_puntaje_por_modulo,
      })
      .from(perfilesTable)
      .where(eq(perfilesTable.id, userId));

    if (!perfil) {
      res.status(404).json({ error: "not_found", message: "Perfil no encontrado" });
      return;
    }

    res.json(perfil);
  } catch (err) {
    req.log.error({ err }, "Error al obtener perfil");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// GET /profiles/:userId/results - Obtener resultados de un usuario (solo docentes)
router.get("/profiles/:userId/results", requireAuth, requireDocente, async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    const resultados = await db
      .select()
      .from(resultadosTable)
      .where(eq(resultadosTable.id_usuario, userId))
      .orderBy(desc(resultadosTable.fecha));

    const resultadosConInfo = await Promise.all(
      resultados.map(async (r) => {
        let reto = null;
        if (!r.is_custom) {
          const [retoData] = await db.select().from(retosTable).where(eq(retosTable.id, r.id_reto));
          reto = retoData || null;
        }
        return { ...r, reto };
      })
    );

    res.json(resultadosConInfo);
  } catch (err) {
    req.log.error({ err }, "Error al obtener resultados del usuario");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

export default router;
