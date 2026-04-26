// Rutas de modulos: listar y obtener modulos educativos por ano de bachillerato
// Los modulos representan los 3 anos de la especialidad de informatica
import { Router } from "express";
import { db } from "@workspace/db";
import { modulosTable, nivelesTable, retosTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /modules - Obtener todos los modulos activos (soporta filtro ?anio=N)
router.get("/modules", requireAuth, async (req, res) => {
  try {
    const anio = req.query["anio"] ? Number(req.query["anio"]) : null;

    let query = db.select().from(modulosTable).where(eq(modulosTable.activo, true)).$dynamic();

    if (anio) {
      query = db.select().from(modulosTable).where(and(eq(modulosTable.activo, true), eq(modulosTable.anio_bachillerato, anio))).$dynamic();
    }

    const modulos = await query.orderBy(modulosTable.anio_bachillerato);
    res.json(modulos);
  } catch (err) {
    req.log.error({ err }, "Error al obtener modulos");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// GET /modules/:moduleId - Obtener un modulo especifico por ID
router.get("/modules/:moduleId", requireAuth, async (req, res) => {
  try {
    const moduleId = Number(req.params.moduleId);
    const [modulo] = await db
      .select()
      .from(modulosTable)
      .where(eq(modulosTable.id, moduleId));

    if (!modulo) {
      res.status(404).json({ error: "not_found", message: "Modulo no encontrado" });
      return;
    }

    res.json(modulo);
  } catch (err) {
    req.log.error({ err }, "Error al obtener modulo");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// GET /modules/:moduleId/levels - Obtener los niveles de un modulo
router.get("/modules/:moduleId/levels", requireAuth, async (req, res) => {
  try {
    const moduleId = Number(req.params.moduleId);
    const niveles = await db
      .select()
      .from(nivelesTable)
      .where(and(eq(nivelesTable.id_modulo, moduleId), eq(nivelesTable.activo, true)))
      .orderBy(nivelesTable.orden);

    res.json(niveles);
  } catch (err) {
    req.log.error({ err }, "Error al obtener niveles del modulo");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// GET /modules/:moduleId/challenges - Obtener los retos de un modulo
router.get("/modules/:moduleId/challenges", requireAuth, async (req, res) => {
  try {
    const moduleId = Number(req.params.moduleId);

    // Obtiene los retos del modulo con informacion del nivel
    const retos = await db
      .select({
        id: retosTable.id,
        nombre: retosTable.nombre,
        descripcion: retosTable.descripcion,
        tipo_juego: retosTable.tipo_juego,
        id_modulo: retosTable.id_modulo,
        id_nivel: retosTable.id_nivel,
        tiempo_limite: retosTable.tiempo_limite,
        puntos_maximos: retosTable.puntos_maximos,
        numero_preguntas: retosTable.numero_preguntas,
        activo: retosTable.activo,
        creado_en: retosTable.creado_en,
      })
      .from(retosTable)
      .where(and(eq(retosTable.id_modulo, moduleId), eq(retosTable.activo, true)));

    // Para cada reto, agrega informacion del nivel y modulo
    const retosConInfo = await Promise.all(
      retos.map(async (reto) => {
        const [nivel] = await db
          .select()
          .from(nivelesTable)
          .where(eq(nivelesTable.id, reto.id_nivel));

        return { ...reto, nivel: nivel || null };
      })
    );

    res.json(retosConInfo);
  } catch (err) {
    req.log.error({ err }, "Error al obtener retos del modulo");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

export default router;
