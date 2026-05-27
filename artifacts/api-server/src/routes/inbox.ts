// Rutas de bandeja de entrada: alertas, recomendaciones y feedback del docente
// Los estudiantes pueden ver sus notificaciones y marcarlas como leidas
import { Router } from "express";
import { db } from "@workspace/db";
import {
  alertasTable,
  recomendacionesTable,
  feedbackDocenteTable,
  perfilesTable,
} from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

// GET /inbox/alerts - Obtener todas las alertas del usuario actual
// Normaliza los campos para que el frontend use titulo+mensaje en lugar de descripcion
router.get("/inbox/alerts", requireAuth, async (req: AuthRequest, res) => {
  try {
    const alertas = await db
      .select()
      .from(alertasTable)
      .where(eq(alertasTable.id_usuario, req.user!.id))
      .orderBy(desc(alertasTable.fecha));

    // Normaliza los datos: agrega titulo y mensaje desde descripcion
    const alertasNormalizadas = alertas.map((a) => ({
      id: a.id,
      titulo: a.tipo === "logro" ? "¡Logro Desbloqueado!" :
              a.tipo === "bajo_rendimiento" ? "Alerta de Rendimiento" :
              a.tipo === "nivel_completado" ? "Nivel Completado" : "Mensaje del Sistema",
      mensaje: a.descripcion,
      tipo: a.tipo,
      leido: a.leida,
      fecha_creacion: a.fecha,
    }));

    res.json(alertasNormalizadas);
  } catch (err) {
    req.log.error({ err }, "Error al obtener alertas");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// PUT /inbox/alerts/:alertId/read - Marcar una alerta como leida
router.put("/inbox/alerts/:alertId/read", requireAuth, async (req: AuthRequest, res) => {
  try {
    const alertId = Number(req.params.alertId);

    // Verifica que la alerta pertenece al usuario
    const [alerta] = await db
      .select()
      .from(alertasTable)
      .where(and(eq(alertasTable.id, alertId), eq(alertasTable.id_usuario, req.user!.id)));

    if (!alerta) {
      res.status(404).json({ error: "not_found", message: "Alerta no encontrada" });
      return;
    }

    await db
      .update(alertasTable)
      .set({ leida: true })
      .where(eq(alertasTable.id, alertId));

    res.json({ success: true, message: "Alerta marcada como leida" });
  } catch (err) {
    req.log.error({ err }, "Error al marcar alerta como leida");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// POST /inbox/alerts/:alertId/read - Marcar alerta como leida (alternativa a PUT)
router.post("/inbox/alerts/:alertId/read", requireAuth, async (req: AuthRequest, res) => {
  try {
    const alertId = Number(req.params.alertId);
    const [alerta] = await db
      .select()
      .from(alertasTable)
      .where(and(eq(alertasTable.id, alertId), eq(alertasTable.id_usuario, req.user!.id)));

    if (!alerta) {
      res.status(404).json({ error: "not_found", message: "Alerta no encontrada" });
      return;
    }

    await db.update(alertasTable).set({ leida: true }).where(eq(alertasTable.id, alertId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Error al marcar alerta");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// POST /inbox/feedback - Enviar mensaje al docente (desde estudiante)
router.post("/inbox/feedback", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { mensaje } = req.body;
    if (!mensaje?.trim()) {
      res.status(400).json({ error: "validation_error", message: "El mensaje es requerido" });
      return;
    }

    // Busca el primer docente disponible para asignar el mensaje
    const [docente] = await db
      .select({ id: perfilesTable.id })
      .from(perfilesTable)
      .where(eq(perfilesTable.rol, "docente"))
      .limit(1);

    if (!docente) {
      res.status(404).json({ error: "not_found", message: "No hay docentes disponibles" });
      return;
    }

    const [nuevoFeedback] = await db
      .insert(feedbackDocenteTable)
      .values({
        id_estudiante: req.user!.id,
        id_docente: docente.id,
        contenido: mensaje.trim(),
        tipo: "general",
        leido: false,
      })
      .returning();

    res.status(201).json(nuevoFeedback);
  } catch (err) {
    req.log.error({ err }, "Error al enviar feedback");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// GET /inbox/recommendations - Obtener recomendaciones del usuario actual
router.get("/inbox/recommendations", requireAuth, async (req: AuthRequest, res) => {
  try {
    const recomendaciones = await db
      .select()
      .from(recomendacionesTable)
      .where(eq(recomendacionesTable.id_usuario, req.user!.id))
      .orderBy(desc(recomendacionesTable.fecha));

    // Normaliza los campos para el frontend
    const recNormalizadas = recomendaciones.map((r) => ({
      id: r.id,
      titulo: r.motivo || "Recomendacion personalizada",
      descripcion: r.descripcion,
      tipo: r.tipo,
      leido: r.leida,
      fecha_creacion: r.fecha,
    }));

    res.json(recNormalizadas);
  } catch (err) {
    req.log.error({ err }, "Error al obtener recomendaciones");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// DELETE /inbox/recommendations/:id - Eliminar una recomendacion (aceptar o rechazar)
router.delete("/inbox/recommendations/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const recId = Number(req.params.id);

    const [rec] = await db
      .select()
      .from(recomendacionesTable)
      .where(and(eq(recomendacionesTable.id, recId), eq(recomendacionesTable.id_usuario, req.user!.id)));

    if (!rec) {
      res.status(404).json({ error: "not_found", message: "Recomendacion no encontrada" });
      return;
    }

    await db.delete(recomendacionesTable).where(eq(recomendacionesTable.id, recId));

    res.json({ success: true, message: "Recomendacion eliminada" });
  } catch (err) {
    req.log.error({ err }, "Error al eliminar recomendacion");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// GET /inbox/feedback - Obtener feedback recibido del docente (mensajes del estudiante + respuestas)
router.get("/inbox/feedback", requireAuth, async (req: AuthRequest, res) => {
  try {
    const feedback = await db
      .select()
      .from(feedbackDocenteTable)
      .where(eq(feedbackDocenteTable.id_estudiante, req.user!.id))
      .orderBy(desc(feedbackDocenteTable.creado_en));

    // Normaliza: usa 'mensaje' en lugar de 'contenido' para el frontend
    const feedbackNormalizado = await Promise.all(
      feedback.map(async (f) => {
        const [docente] = await db
          .select({ nombre: perfilesTable.nombre })
          .from(perfilesTable)
          .where(eq(perfilesTable.id, f.id_docente));
        return {
          id: f.id,
          mensaje: f.contenido,
          respuesta: null,
          leido: f.leido,
          fecha_creacion: f.creado_en,
          docente_nombre: docente?.nombre || "Docente",
        };
      })
    );

    res.json(feedbackNormalizado);
  } catch (err) {
    req.log.error({ err }, "Error al obtener feedback");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// GET /inbox/unread-count - Obtener el numero de mensajes no leidos
router.get("/inbox/unread-count", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const [alertasNoLeidas] = await db
      .select({ cnt: count() })
      .from(alertasTable)
      .where(and(eq(alertasTable.id_usuario, userId), eq(alertasTable.leida, false)));

    const [feedbackNoLeido] = await db
      .select({ cnt: count() })
      .from(feedbackDocenteTable)
      .where(and(eq(feedbackDocenteTable.id_estudiante, userId), eq(feedbackDocenteTable.leido, false)));

    const [recomendacionesNoLeidas] = await db
      .select({ cnt: count() })
      .from(recomendacionesTable)
      .where(and(eq(recomendacionesTable.id_usuario, userId), eq(recomendacionesTable.leida, false)));

    const alerts = Number(alertasNoLeidas?.cnt || 0);
    const feedback = Number(feedbackNoLeido?.cnt || 0);
    const recommendations = Number(recomendacionesNoLeidas?.cnt || 0);

    res.json({
      alerts,
      feedback,
      recommendations,
      total: alerts + feedback + recommendations,
    });
  } catch (err) {
    req.log.error({ err }, "Error al obtener conteo de no leidos");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

export default router;
