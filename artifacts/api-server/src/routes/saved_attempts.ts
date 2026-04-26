// Rutas de intentos guardados: guardar y recuperar progreso de retos incompletos
// Cuando el estudiante abandona un reto, su progreso se guarda para retomarlo despues
import { Router } from "express";
import { db } from "@workspace/db";
import { intentosGuardadosTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

// GET /saved-attempts - Obtener todos los intentos guardados del usuario actual
router.get("/saved-attempts", requireAuth, async (req: AuthRequest, res) => {
  try {
    const intentos = await db
      .select()
      .from(intentosGuardadosTable)
      .where(eq(intentosGuardadosTable.id_usuario, req.user!.id));

    res.json(intentos);
  } catch (err) {
    req.log.error({ err }, "Error al obtener intentos guardados");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// POST /saved-attempts - Guardar o actualizar el progreso de un intento
router.post("/saved-attempts", requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      id_reto,
      progreso_json,
      respuestas_json,
      pregunta_actual,
      puntuacion_parcial,
      tiempo_transcurrido,
    } = req.body;

    // Verifica si ya existe un intento guardado para este reto
    const [existente] = await db
      .select()
      .from(intentosGuardadosTable)
      .where(
        and(
          eq(intentosGuardadosTable.id_usuario, req.user!.id),
          eq(intentosGuardadosTable.id_reto, Number(id_reto))
        )
      );

    let intento;

    if (existente) {
      // Actualiza el intento existente
      const [actualizado] = await db
        .update(intentosGuardadosTable)
        .set({
          progreso_json: progreso_json || {},
          respuestas_json: respuestas_json || {},
          pregunta_actual: Number(pregunta_actual) || 0,
          puntuacion_parcial: Number(puntuacion_parcial) || 0,
          tiempo_transcurrido: Number(tiempo_transcurrido) || 0,
          actualizado_en: new Date(),
        })
        .where(eq(intentosGuardadosTable.id, existente.id))
        .returning();
      intento = actualizado;
    } else {
      // Crea un nuevo intento guardado
      const [nuevo] = await db
        .insert(intentosGuardadosTable)
        .values({
          id_usuario: req.user!.id,
          id_reto: Number(id_reto),
          progreso_json: progreso_json || {},
          respuestas_json: respuestas_json || {},
          pregunta_actual: Number(pregunta_actual) || 0,
          puntuacion_parcial: Number(puntuacion_parcial) || 0,
          tiempo_transcurrido: Number(tiempo_transcurrido) || 0,
        })
        .returning();
      intento = nuevo;
    }

    res.json(intento);
  } catch (err) {
    req.log.error({ err }, "Error al guardar intento");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// GET /saved-attempts/:challengeId - Obtener el intento guardado de un reto especifico
router.get("/saved-attempts/:challengeId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const challengeId = Number(req.params.challengeId);

    const [intento] = await db
      .select()
      .from(intentosGuardadosTable)
      .where(
        and(
          eq(intentosGuardadosTable.id_usuario, req.user!.id),
          eq(intentosGuardadosTable.id_reto, challengeId)
        )
      );

    if (!intento) {
      res.status(404).json({ error: "not_found", message: "No hay intento guardado para este reto" });
      return;
    }

    res.json(intento);
  } catch (err) {
    req.log.error({ err }, "Error al obtener intento guardado");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// DELETE /saved-attempts/:challengeId - Eliminar intento guardado (despues de completar)
router.delete("/saved-attempts/:challengeId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const challengeId = Number(req.params.challengeId);

    await db
      .delete(intentosGuardadosTable)
      .where(
        and(
          eq(intentosGuardadosTable.id_usuario, req.user!.id),
          eq(intentosGuardadosTable.id_reto, challengeId)
        )
      );

    res.json({ success: true, message: "Intento guardado eliminado" });
  } catch (err) {
    req.log.error({ err }, "Error al eliminar intento guardado");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

export default router;
