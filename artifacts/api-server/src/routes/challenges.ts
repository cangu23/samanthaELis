// Rutas de retos: retos predefinidos y retos personalizados por docentes
// Los retos son el corazon de la plataforma de competencia
import { Router } from "express";
import { db } from "@workspace/db";
import {
  retosTable,
  retosPersonalizadosTable,
  retosPersonalizadosPreguntasTable,
  preguntasTable,
  modulosTable,
  nivelesTable,
  perfilesTable,
} from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, requireDocente, type AuthRequest } from "../lib/auth";

const router = Router();

// GET /challenges - Obtener todos los retos predefinidos activos (soporta filtro ?id_modulo=N)
router.get("/challenges", requireAuth, async (req, res) => {
  try {
    const idModulo = req.query["id_modulo"] ? Number(req.query["id_modulo"]) : null;

    const retos = await db
      .select()
      .from(retosTable)
      .where(
        idModulo
          ? and(eq(retosTable.activo, true), eq(retosTable.id_modulo, idModulo))
          : eq(retosTable.activo, true)
      );

    // Agrega informacion de modulo y nivel a cada reto
    const retosConInfo = await Promise.all(
      retos.map(async (reto) => {
        const [modulo] = await db.select().from(modulosTable).where(eq(modulosTable.id, reto.id_modulo));
        const [nivel] = await db.select().from(nivelesTable).where(eq(nivelesTable.id, reto.id_nivel));
        return { ...reto, modulo: modulo || null, nivel: nivel || null };
      })
    );

    res.json(retosConInfo);
  } catch (err) {
    req.log.error({ err }, "Error al obtener retos");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// GET /challenges/:challengeId - Obtener un reto con sus preguntas
router.get("/challenges/:challengeId", requireAuth, async (req, res) => {
  try {
    const challengeId = Number(req.params.challengeId);
    const [reto] = await db.select().from(retosTable).where(eq(retosTable.id, challengeId));

    if (!reto) {
      res.status(404).json({ error: "not_found", message: "Reto no encontrado" });
      return;
    }

    // Obtiene las preguntas del nivel y modulo correspondiente
    const preguntas = await db
      .select()
      .from(preguntasTable)
      .where(
        and(
          eq(preguntasTable.id_modulo, reto.id_modulo),
          eq(preguntasTable.id_nivel, reto.id_nivel),
          eq(preguntasTable.activa, true)
        )
      )
      .limit(reto.numero_preguntas);

    const [modulo] = await db.select().from(modulosTable).where(eq(modulosTable.id, reto.id_modulo));
    const [nivel] = await db.select().from(nivelesTable).where(eq(nivelesTable.id, reto.id_nivel));

    res.json({ ...reto, preguntas, modulo: modulo || null, nivel: nivel || null });
  } catch (err) {
    req.log.error({ err }, "Error al obtener reto");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// GET /challenges/:challengeId/questions - Obtener solo las preguntas de un reto
router.get("/challenges/:challengeId/questions", requireAuth, async (req, res) => {
  try {
    const challengeId = Number(req.params.challengeId);
    const [reto] = await db.select().from(retosTable).where(eq(retosTable.id, challengeId));

    if (!reto) {
      res.status(404).json({ error: "not_found", message: "Reto no encontrado" });
      return;
    }

    // Shuffle aleatorio usando ORDER BY RANDOM() - diferente orden en cada intento
    const preguntas = await db
      .select()
      .from(preguntasTable)
      .where(
        and(
          eq(preguntasTable.id_modulo, reto.id_modulo),
          eq(preguntasTable.id_nivel, reto.id_nivel),
          eq(preguntasTable.activa, true)
        )
      )
      .orderBy(sql`RANDOM()`)
      .limit(reto.numero_preguntas);

    // Parsea las opciones que estan guardadas como JSON string
    const preguntasParseadas = preguntas.map((p) => ({
      ...p,
      opciones: typeof p.opciones === "string" ? JSON.parse(p.opciones) : p.opciones,
    }));

    res.json(preguntasParseadas);
  } catch (err) {
    req.log.error({ err }, "Error al obtener preguntas del reto");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// POST /challenges/:challengeId/check-answer - Verificar si una respuesta es correcta
router.post("/challenges/:challengeId/check-answer", requireAuth, async (req, res) => {
  try {
    const { pregunta_id, respuesta } = req.body;

    if (!pregunta_id || respuesta === undefined) {
      res.status(400).json({ error: "validation_error", message: "pregunta_id y respuesta son requeridos" });
      return;
    }

    const [pregunta] = await db
      .select()
      .from(preguntasTable)
      .where(eq(preguntasTable.id, Number(pregunta_id)));

    if (!pregunta) {
      res.status(404).json({ error: "not_found", message: "Pregunta no encontrada" });
      return;
    }

    const correcta =
      pregunta.respuesta_correcta.trim().toLowerCase() === String(respuesta).trim().toLowerCase();

    res.json({
      correcta,
      respuesta_correcta: pregunta.respuesta_correcta,
      explicacion: pregunta.explicacion || null,
      puntos: correcta ? pregunta.puntos : 0,
    });
  } catch (err) {
    req.log.error({ err }, "Error al verificar respuesta");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// GET /challenges/custom - Obtener todos los retos personalizados
router.get("/challenges/custom", requireAuth, async (req, res) => {
  try {
    const retos = await db
      .select()
      .from(retosPersonalizadosTable)
      .where(eq(retosPersonalizadosTable.activo, true));

    const retosConInfo = await Promise.all(
      retos.map(async (reto) => {
        const [docente] = await db
          .select({ id: perfilesTable.id, nombre: perfilesTable.nombre, usuario: perfilesTable.usuario, rol: perfilesTable.rol })
          .from(perfilesTable)
          .where(eq(perfilesTable.id, reto.id_docente));
        const [modulo] = await db.select().from(modulosTable).where(eq(modulosTable.id, reto.id_modulo));
        const [nivel] = await db.select().from(nivelesTable).where(eq(nivelesTable.id, reto.id_nivel));
        return { ...reto, docente: docente || null, modulo: modulo || null, nivel: nivel || null };
      })
    );

    res.json(retosConInfo);
  } catch (err) {
    req.log.error({ err }, "Error al obtener retos personalizados");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// POST /challenges/custom - Crear un reto personalizado (solo docentes)
router.post("/challenges/custom", requireAuth, requireDocente, async (req: AuthRequest, res) => {
  try {
    const { nombre, descripcion, tipo_juego, id_modulo, id_nivel, puntos_maximos, numero_preguntas, tiempo_limite, preguntas } = req.body;

    if (!nombre || !tipo_juego || !id_modulo || !id_nivel) {
      res.status(400).json({ error: "validation_error", message: "Campos requeridos faltantes" });
      return;
    }

    // Crea el reto personalizado en la base de datos
    const [nuevoReto] = await db
      .insert(retosPersonalizadosTable)
      .values({
        id_docente: req.user!.id,
        nombre,
        descripcion,
        tipo_juego,
        id_modulo: Number(id_modulo),
        id_nivel: Number(id_nivel),
        puntos_maximos: puntos_maximos || 100,
        numero_preguntas: numero_preguntas || 10,
        tiempo_limite: tiempo_limite || 300,
      })
      .returning();

    // Si se proporcionaron preguntas, las guarda en la tabla de preguntas del reto
    if (preguntas && Array.isArray(preguntas) && preguntas.length > 0) {
      await db.insert(retosPersonalizadosPreguntasTable).values(
        preguntas.map((p: { texto: string; tipo: string; opciones?: string[]; respuesta_correcta: string; explicacion?: string; dificultad: string; puntos?: number; }) => ({
          id_reto: nuevoReto.id,
          id_pregunta: 0,
          texto: p.texto,
          tipo: p.tipo,
          opciones: p.opciones ? JSON.stringify(p.opciones) : null,
          respuesta_correcta: p.respuesta_correcta,
          explicacion: p.explicacion || null,
          dificultad: p.dificultad,
          puntos: p.puntos || 10,
        }))
      );
    }

    const [docente] = await db
      .select({ id: perfilesTable.id, nombre: perfilesTable.nombre, usuario: perfilesTable.usuario, rol: perfilesTable.rol })
      .from(perfilesTable)
      .where(eq(perfilesTable.id, req.user!.id));

    const [modulo] = await db.select().from(modulosTable).where(eq(modulosTable.id, nuevoReto.id_modulo));
    const [nivel] = await db.select().from(nivelesTable).where(eq(nivelesTable.id, nuevoReto.id_nivel));

    res.status(201).json({ ...nuevoReto, docente, modulo, nivel });
  } catch (err) {
    req.log.error({ err }, "Error al crear reto personalizado");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// GET /challenges/custom/:challengeId - Obtener un reto personalizado con preguntas
router.get("/challenges/custom/:challengeId", requireAuth, async (req, res) => {
  try {
    const challengeId = Number(req.params.challengeId);
    const [reto] = await db
      .select()
      .from(retosPersonalizadosTable)
      .where(eq(retosPersonalizadosTable.id, challengeId));

    if (!reto) {
      res.status(404).json({ error: "not_found", message: "Reto personalizado no encontrado" });
      return;
    }

    // Obtiene las preguntas del reto personalizado
    const preguntasReto = await db
      .select()
      .from(retosPersonalizadosPreguntasTable)
      .where(eq(retosPersonalizadosPreguntasTable.id_reto, challengeId));

    const preguntas = preguntasReto.map((p) => ({
      ...p,
      opciones: p.opciones ? JSON.parse(p.opciones) : null,
    }));

    const [docente] = await db
      .select({ id: perfilesTable.id, nombre: perfilesTable.nombre, usuario: perfilesTable.usuario, rol: perfilesTable.rol })
      .from(perfilesTable)
      .where(eq(perfilesTable.id, reto.id_docente));
    const [modulo] = await db.select().from(modulosTable).where(eq(modulosTable.id, reto.id_modulo));
    const [nivel] = await db.select().from(nivelesTable).where(eq(nivelesTable.id, reto.id_nivel));

    res.json({ ...reto, preguntas, docente, modulo, nivel });
  } catch (err) {
    req.log.error({ err }, "Error al obtener reto personalizado");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// PUT /challenges/custom/:challengeId - Actualizar un reto personalizado
router.put("/challenges/custom/:challengeId", requireAuth, requireDocente, async (req: AuthRequest, res) => {
  try {
    const challengeId = Number(req.params.challengeId);
    const { nombre, descripcion, tipo_juego, id_modulo, id_nivel, puntos_maximos, numero_preguntas, tiempo_limite } = req.body;

    const [reto] = await db
      .select()
      .from(retosPersonalizadosTable)
      .where(eq(retosPersonalizadosTable.id, challengeId));

    if (!reto || reto.id_docente !== req.user!.id) {
      res.status(404).json({ error: "not_found", message: "Reto no encontrado o sin permiso" });
      return;
    }

    const [actualizado] = await db
      .update(retosPersonalizadosTable)
      .set({ nombre, descripcion, tipo_juego, id_modulo, id_nivel, puntos_maximos, numero_preguntas, tiempo_limite })
      .where(eq(retosPersonalizadosTable.id, challengeId))
      .returning();

    const [modulo] = await db.select().from(modulosTable).where(eq(modulosTable.id, actualizado.id_modulo));
    const [nivel] = await db.select().from(nivelesTable).where(eq(nivelesTable.id, actualizado.id_nivel));

    res.json({ ...actualizado, modulo, nivel });
  } catch (err) {
    req.log.error({ err }, "Error al actualizar reto personalizado");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// DELETE /challenges/custom/:challengeId - Eliminar un reto personalizado
router.delete("/challenges/custom/:challengeId", requireAuth, requireDocente, async (req: AuthRequest, res) => {
  try {
    const challengeId = Number(req.params.challengeId);

    const [reto] = await db
      .select()
      .from(retosPersonalizadosTable)
      .where(eq(retosPersonalizadosTable.id, challengeId));

    if (!reto || reto.id_docente !== req.user!.id) {
      res.status(404).json({ error: "not_found", message: "Reto no encontrado o sin permiso" });
      return;
    }

    // Elimina primero las preguntas del reto (foreign key)
    await db
      .delete(retosPersonalizadosPreguntasTable)
      .where(eq(retosPersonalizadosPreguntasTable.id_reto, challengeId));

    await db.delete(retosPersonalizadosTable).where(eq(retosPersonalizadosTable.id, challengeId));

    res.json({ success: true, message: "Reto eliminado exitosamente" });
  } catch (err) {
    req.log.error({ err }, "Error al eliminar reto personalizado");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

export default router;
