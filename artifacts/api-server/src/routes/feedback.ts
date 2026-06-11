// Rutas de feedback docente: enviar y marcar como leido
// Los docentes pueden enviar mensajes personalizados a los estudiantes
import { Router } from "express";
import { db } from "@workspace/db";
import { feedbackDocenteTable, perfilesTable, tipoFeedbackEnum } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireDocente, type AuthRequest } from "../lib/auth";
import { z } from "zod";

const router = Router();

// Zod schema for validating the request body when sending feedback
const createFeedbackInputSchema = z.object({
  id_estudiante: z.number().int().positive({ message: "ID de estudiante debe ser un número entero positivo." }),
  contenido: z.string().min(1, { message: "El contenido del feedback no puede estar vacío." }),
  tipo: z.enum(tipoFeedbackEnum.enumValues, { message: "Tipo de feedback inválido." }),
});

// POST /feedback - Enviar feedback a un estudiante (solo docentes)
router.post("/feedback", requireAuth, requireDocente, async (req: AuthRequest, res) => {
  try {
    const validationResult = createFeedbackInputSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({ error: "validation_error", message: validationResult.error.issues.map((e: z.ZodIssue) => e.message).join(", ") });
      return;
    }

    const { id_estudiante, contenido, tipo } = validationResult.data;

    // Verifica que el destinatario existe y es estudiante
    const [estudiante] = await db
      .select()
      .from(perfilesTable)
      .where(and(eq(perfilesTable.id, id_estudiante), eq(perfilesTable.rol, "estudiante")));

    if (!estudiante) {
      res.status(404).json({ error: "not_found", message: "Estudiante no encontrado" });
      return;
    }

    // Crea el mensaje de feedback
    const [feedback] = await db
      .insert(feedbackDocenteTable)
      .values({
        id_docente: req.user!.id,
        id_estudiante,
        contenido,
        tipo,
      })
      .returning();

    // Agrega informacion del docente en la respuesta
    const [docente] = await db
      .select({
        id: perfilesTable.id,
        nombre: perfilesTable.nombre,
        usuario: perfilesTable.usuario,
        rol: perfilesTable.rol,
      })
      .from(perfilesTable)
      .where(eq(perfilesTable.id, req.user!.id));

    res.status(201).json({ ...feedback, docente });
  } catch (err) {
    req.log.error({ err }, "Error al enviar feedback");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// PUT /feedback/:feedbackId/read - Marcar feedback como leido
router.put("/feedback/:feedbackId/read", requireAuth, async (req: AuthRequest, res) => {
  try {
    const feedbackId = Number(req.params.feedbackId);

    // Verifica que el feedback pertenece al usuario (como estudiante)
    const [feedback] = await db
      .select()
      .from(feedbackDocenteTable)
      .where(
        and(
          eq(feedbackDocenteTable.id, feedbackId),
          eq(feedbackDocenteTable.id_estudiante, req.user!.id)
        )
      );

    if (!feedback) {
      res.status(404).json({ error: "not_found", message: "Feedback no encontrado" });
      return;
    }

    await db
      .update(feedbackDocenteTable)
      .set({ leido: true })
      .where(eq(feedbackDocenteTable.id, feedbackId));

    res.json({ success: true, message: "Feedback marcado como leido" });
  } catch (err) {
    req.log.error({ err }, "Error al marcar feedback como leido");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

export default router;
