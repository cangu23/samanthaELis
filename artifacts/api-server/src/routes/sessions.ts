// Rutas de sesiones de competencia: el docente crea una sesion con un codigo unico
// Los estudiantes se unen con el link compartible y compiten en el mismo reto
import { Router } from "express";
import { db } from "@workspace/db";
import {
  sesionesCompetenciaTable,
  participantesSesionTable,
  retosTable,
  perfilesTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// POST /api/sessions — docente crea una sesion de competencia
router.post("/sessions", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.rol !== "docente") {
      res.status(403).json({ error: "forbidden", message: "Solo los docentes pueden crear sesiones" });
      return;
    }
    const { nombre, id_reto } = req.body;
    if (!nombre?.trim() || !id_reto) {
      res.status(400).json({ error: "validation_error", message: "nombre e id_reto son requeridos" });
      return;
    }

    let codigo = generateCode();
    for (let i = 0; i < 10; i++) {
      const [existing] = await db.select().from(sesionesCompetenciaTable)
        .where(eq(sesionesCompetenciaTable.codigo, codigo));
      if (!existing) break;
      codigo = generateCode();
    }

    const [sesion] = await db.insert(sesionesCompetenciaTable).values({
      codigo,
      nombre: nombre.trim(),
      id_reto: Number(id_reto),
      id_docente: req.user!.id,
      activa: true,
    }).returning();

    res.status(201).json({ ...sesion, link: `/competir/${codigo}` });
  } catch (err) {
    req.log.error({ err }, "Error al crear sesion");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// GET /api/sessions — docente obtiene todas sus sesiones
router.get("/sessions", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.rol !== "docente") {
      res.status(403).json({ error: "forbidden", message: "Solo los docentes pueden ver sus sesiones" });
      return;
    }

    const sesiones = await db.select().from(sesionesCompetenciaTable)
      .where(eq(sesionesCompetenciaTable.id_docente, req.user!.id))
      .orderBy(desc(sesionesCompetenciaTable.creado_en));

    const sesionesConInfo = await Promise.all(sesiones.map(async (s) => {
      const participantes = await db.select().from(participantesSesionTable)
        .where(eq(participantesSesionTable.id_sesion, s.id));
      const [reto] = await db.select({ nombre: retosTable.nombre, tipo_juego: retosTable.tipo_juego })
        .from(retosTable).where(eq(retosTable.id, s.id_reto));
      return {
        ...s,
        participantes_count: participantes.length,
        reto_nombre: reto?.nombre || "—",
        reto_tipo: reto?.tipo_juego || "",
      };
    }));

    res.json(sesionesConInfo);
  } catch (err) {
    req.log.error({ err }, "Error al obtener sesiones");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// GET /api/sessions/:code — info de sesion publica (para que el estudiante se una)
router.get("/sessions/:code", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [sesion] = await db.select().from(sesionesCompetenciaTable)
      .where(eq(sesionesCompetenciaTable.codigo, (req.params.code as string).toUpperCase()));

    if (!sesion) {
      res.status(404).json({ error: "not_found", message: "Sesion no encontrada" });
      return;
    }

    const [reto] = await db.select().from(retosTable).where(eq(retosTable.id, sesion.id_reto));
    const [docente] = await db.select({ nombre: perfilesTable.nombre })
      .from(perfilesTable).where(eq(perfilesTable.id, sesion.id_docente));
    const participantes = await db.select().from(participantesSesionTable)
      .where(eq(participantesSesionTable.id_sesion, sesion.id));

    res.json({
      ...sesion,
      reto,
      docente_nombre: docente?.nombre || "Docente",
      participantes_count: participantes.length,
    });
  } catch (err) {
    req.log.error({ err }, "Error al obtener sesion");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// POST /api/sessions/:code/result — estudiante registra su resultado en la sesion
router.post("/sessions/:code/result", requireAuth, async (req: AuthRequest, res) => {
  try {
    const code = (req.params.code as string).toUpperCase();
    const [sesion] = await db.select().from(sesionesCompetenciaTable)
      .where(eq(sesionesCompetenciaTable.codigo, code));

    if (!sesion) {
      res.status(404).json({ error: "not_found", message: "Sesion no encontrada" });
      return;
    }
    if (!sesion.activa) {
      res.status(400).json({ error: "session_closed", message: "La sesion ya no esta activa" });
      return;
    }

    const { puntuacion, tiempo_total, respuestas_correctas, total_preguntas } = req.body;
    const [existing] = await db.select().from(participantesSesionTable)
      .where(and(
        eq(participantesSesionTable.id_sesion, sesion.id),
        eq(participantesSesionTable.id_usuario, req.user!.id),
      ));

    if (existing) {
      const [updated] = await db.update(participantesSesionTable).set({
        puntuacion: Number(puntuacion || 0),
        tiempo_total: Number(tiempo_total || 0),
        respuestas_correctas: Number(respuestas_correctas || 0),
        total_preguntas: Number(total_preguntas || 0),
        completado: true,
      }).where(eq(participantesSesionTable.id, existing.id)).returning();
      res.json(updated);
    } else {
      const [nuevo] = await db.insert(participantesSesionTable).values({
        id_sesion: sesion.id,
        id_usuario: req.user!.id,
        puntuacion: Number(puntuacion || 0),
        tiempo_total: Number(tiempo_total || 0),
        respuestas_correctas: Number(respuestas_correctas || 0),
        total_preguntas: Number(total_preguntas || 0),
        completado: true,
      }).returning();
      res.status(201).json(nuevo);
    }
  } catch (err) {
    req.log.error({ err }, "Error al registrar resultado de sesion");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// GET /api/sessions/:code/ranking — ranking de la sesion de competencia
router.get("/sessions/:code/ranking", requireAuth, async (req: AuthRequest, res) => {
  try {
    const code = (req.params.code as string).toUpperCase();
    const [sesion] = await db.select().from(sesionesCompetenciaTable)
      .where(eq(sesionesCompetenciaTable.codigo, code));

    if (!sesion) {
      res.status(404).json({ error: "not_found", message: "Sesion no encontrada" });
      return;
    }

    const participantes = await db.select().from(participantesSesionTable)
      .where(eq(participantesSesionTable.id_sesion, sesion.id))
      .orderBy(desc(participantesSesionTable.puntuacion));

    const rankingConPerfiles = await Promise.all(participantes.map(async (p, index) => {
      const [perfil] = await db.select({
        nombre: perfilesTable.nombre,
        usuario: perfilesTable.usuario,
        grado_bachillerato: perfilesTable.grado_bachillerato,
      }).from(perfilesTable).where(eq(perfilesTable.id, p.id_usuario));

      return {
        posicion: index + 1,
        usuario_id: p.id_usuario,
        nombre: perfil?.nombre || "Estudiante",
        usuario: perfil?.usuario || "",
        grado_bachillerato: perfil?.grado_bachillerato ?? null,
        puntuacion: p.puntuacion,
        tiempo_total: p.tiempo_total,
        respuestas_correctas: p.respuestas_correctas,
        total_preguntas: p.total_preguntas,
        completado: p.completado,
      };
    }));

    res.json(rankingConPerfiles);
  } catch (err) {
    req.log.error({ err }, "Error al obtener ranking de sesion");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// GET /api/sessions/:code/report — informe detallado para el docente
router.get("/sessions/:code/report", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.rol !== "docente") {
      res.status(403).json({ error: "forbidden", message: "Solo los docentes pueden ver el informe" });
      return;
    }

    const code = (req.params.code as string).toUpperCase();
    const [sesion] = await db.select().from(sesionesCompetenciaTable)
      .where(and(
        eq(sesionesCompetenciaTable.codigo, code),
        eq(sesionesCompetenciaTable.id_docente, req.user!.id),
      ));

    if (!sesion) {
      res.status(404).json({ error: "not_found", message: "Sesion no encontrada o no eres el creador" });
      return;
    }

    const [reto] = await db.select().from(retosTable).where(eq(retosTable.id, sesion.id_reto));
    const participantes = await db.select().from(participantesSesionTable)
      .where(eq(participantesSesionTable.id_sesion, sesion.id))
      .orderBy(desc(participantesSesionTable.puntuacion));

    const participantesConPerfiles = await Promise.all(participantes.map(async (p) => {
      const [perfil] = await db.select({
        nombre: perfilesTable.nombre,
        usuario: perfilesTable.usuario,
        grado_bachillerato: perfilesTable.grado_bachillerato,
      }).from(perfilesTable).where(eq(perfilesTable.id, p.id_usuario));
      return { ...p, perfil };
    }));

    const total = participantes.length;
    const completaron = participantes.filter((p) => p.completado).length;
    const promPuntuacion = total > 0
      ? Math.round(participantes.reduce((s, p) => s + p.puntuacion, 0) / total) : 0;
    const promPrecision = total > 0
      ? Math.round(participantes.reduce((s, p) =>
          s + (p.total_preguntas > 0 ? (p.respuestas_correctas / p.total_preguntas) * 100 : 0), 0) / total)
      : 0;

    res.json({
      sesion: { ...sesion, reto },
      estadisticas: { totalParticipantes: total, completaron, promPuntuacion, promPrecision },
      participantes: participantesConPerfiles,
    });
  } catch (err) {
    req.log.error({ err }, "Error al obtener informe de sesion");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// PATCH /api/sessions/:code/toggle — docente activa o desactiva la sesion
router.patch("/sessions/:code/toggle", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.rol !== "docente") {
      res.status(403).json({ error: "forbidden" });
      return;
    }
    const code = (req.params.code as string).toUpperCase();
    const [sesion] = await db.select().from(sesionesCompetenciaTable)
      .where(and(
        eq(sesionesCompetenciaTable.codigo, code),
        eq(sesionesCompetenciaTable.id_docente, req.user!.id),
      ));
    if (!sesion) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    const [updated] = await db.update(sesionesCompetenciaTable)
      .set({ activa: !sesion.activa })
      .where(eq(sesionesCompetenciaTable.id, sesion.id))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Error al alternar sesion");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

export default router;
