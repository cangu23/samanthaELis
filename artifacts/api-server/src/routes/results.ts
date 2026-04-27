// Rutas de resultados: registro de intentos y estadisticas del usuario
// Los resultados son la base del sistema de ranking y progreso
import { Router } from "express";
import { db } from "@workspace/db";
import {
  resultadosTable,
  perfilesTable,
  retosTable,
  alertasTable,
} from "@workspace/db";
import { eq, desc, avg, sum, count } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

// POST /results - Registrar el resultado de un reto completado
// Acepta tanto el formato antiguo como el nuevo del frontend
router.post("/results", requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = req.body;

    // Soporte para ambos formatos de datos del frontend
    const id_reto = body.id_reto;
    const is_custom = body.is_custom || false;
    const puntuacion =
      body.puntaje !== undefined ? body.puntaje : body.puntuacion || 0;
    const puntos_maximos_val = body.puntos_maximos || 100;
    const respuestas_correctas = body.respuestas_correctas || 0;
    const total_preguntas = body.total_preguntas || 1;
    const respuestas_incorrectas = total_preguntas - respuestas_correctas;
    const precision_val = respuestas_correctas / Math.max(total_preguntas, 1);
    const tiempo_total_val = body.tiempo_empleado || body.tiempo_total || 0;
    const completado = body.completado !== false;
    const detalles = body.respuestas
      ? JSON.stringify(body.respuestas)
      : body.detalles || null;

    if (!id_reto) {
      res
        .status(400)
        .json({ error: "validation_error", message: "id_reto es requerido" });
      return;
    }

    // Registra el resultado en la base de datos
    const [resultado] = await db
      .insert(resultadosTable)
      .values({
        id_usuario: req.user!.id,
        id_reto: Number(id_reto),
        is_custom: is_custom,
        puntuacion: Number(puntuacion),
        puntos_maximos: Number(puntos_maximos_val),
        precision: precision_val,
        tiempo_total: Number(tiempo_total_val),
        detalles: detalles,
        completado: completado,
        tiempo_respuesta: 0,
        respuestas_correctas: Number(respuestas_correctas),
        respuestas_incorrectas: Number(respuestas_incorrectas),
      })
      .returning();

    // Actualiza los puntos totales y retos completados del usuario
    if (completado) {
      await db
        .update(perfilesTable)
        .set({
          puntos_totales: await db
            .select({ pts: sum(resultadosTable.puntuacion) })
            .from(resultadosTable)
            .where(eq(resultadosTable.id_usuario, req.user!.id))
            .then((r) => Number(r[0]?.pts || 0)),
          retos_completados: await db
            .select({ cnt: count() })
            .from(resultadosTable)
            .where(eq(resultadosTable.id_usuario, req.user!.id))
            .then((r) => Number(r[0]?.cnt || 0)),
        })
        .where(eq(perfilesTable.id, req.user!.id));
    }

    // Si la precision es menor al 50%, genera una alerta de bajo rendimiento
    if (precision_val < 0.5 && completado) {
      await db.insert(alertasTable).values({
        id_usuario: req.user!.id,
        descripcion: `Tu precision en el ultimo reto fue del ${Math.round(precision_val * 100)}%. Te recomendamos repasar los temas del modulo.`,
        tipo: "bajo_rendimiento",
      });
    }

    // Si completo el reto con mas del 80% de precision, genera un logro
    if (precision_val >= 0.8 && completado) {
      await db.insert(alertasTable).values({
        id_usuario: req.user!.id,
        descripcion: `Excelente! Completaste el reto con ${Math.round(precision_val * 100)}% de precision. Sigue adelante!`,
        tipo: "logro",
      });
    }

    res.status(201).json(resultado);
  } catch (err) {
    req.log.error({ err }, "Error al registrar resultado");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// GET /results/my - Obtener los resultados del usuario actual
router.get("/results/my", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resultados = await db
      .select()
      .from(resultadosTable)
      .where(eq(resultadosTable.id_usuario, req.user!.id))
      .orderBy(desc(resultadosTable.fecha));

    // Agrega informacion del reto a cada resultado
    const resultadosConInfo = await Promise.all(
      resultados.map(async (r) => {
        let reto = null;
        if (!r.is_custom) {
          const [retoData] = await db
            .select()
            .from(retosTable)
            .where(eq(retosTable.id, r.id_reto));
          reto = retoData || null;
        }
        return { ...r, reto };
      }),
    );

    res.json(resultadosConInfo);
  } catch (err) {
    req.log.error({ err }, "Error al obtener resultados");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// GET /results/my-history - Historial de retos del usuario actual (alias de /results/my)
router.get(
  "/results/my-history",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const resultados = await db
        .select()
        .from(resultadosTable)
        .where(eq(resultadosTable.id_usuario, req.user!.id))
        .orderBy(desc(resultadosTable.fecha));

      // Agrega informacion del reto a cada resultado
      const resultadosConInfo = await Promise.all(
        resultados.map(async (r) => {
          let retoNombre = "Reto desconocido";
          let tipoJuego = "quiz";
          let puntosMáximos = 100;
          if (!r.is_custom) {
            const [retoData] = await db
              .select()
              .from(retosTable)
              .where(eq(retosTable.id, r.id_reto));
            if (retoData) {
              retoNombre = retoData.nombre;
              tipoJuego = retoData.tipo_juego;
              puntosMáximos = retoData.puntos_maximos;
            }
          }
          return {
            id: r.id,
            nombre_reto: retoNombre,
            tipo_juego: tipoJuego,
            puntaje: r.puntuacion,
            puntos_maximos: r.puntos_maximos || puntosMáximos,
            respuestas_correctas: r.respuestas_correctas || 0,
            total_preguntas:
              (r.respuestas_correctas || 0) + (r.respuestas_incorrectas || 0),
            completado: r.completado,
            fecha_completado: r.fecha,
          };
        }),
      );

      res.json(resultadosConInfo);
    } catch (err) {
      req.log.error({ err }, "Error al obtener historial");
      res.status(500).json({ error: "server_error", message: "Error interno" });
    }
  },
);

// GET /results/stats - Estadisticas del usuario actual
router.get("/results/stats", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    // Obtiene estadisticas agregadas del usuario
    const [stats] = await db
      .select({
        puntos_totales: sum(resultadosTable.puntuacion),
        retos_completados: count(),
        precision_promedio: avg(resultadosTable.precision),
        tiempo_promedio: avg(resultadosTable.tiempo_total),
      })
      .from(resultadosTable)
      .where(eq(resultadosTable.id_usuario, userId));

    const [perfil] = await db
      .select({ racha_dias: perfilesTable.racha_dias })
      .from(perfilesTable)
      .where(eq(perfilesTable.id, userId));

    // Calcula el mejor puntaje
    const resultados = await db
      .select({ puntuacion: resultadosTable.puntuacion })
      .from(resultadosTable)
      .where(eq(resultadosTable.id_usuario, userId))
      .orderBy(desc(resultadosTable.puntuacion))
      .limit(1);

    const mejorPuntaje = resultados[0]?.puntuacion || 0;

    // Calcula la posicion en el ranking (cuantos usuarios tienen mas puntos)
    const todosResultados = await db
      .select({
        id_usuario: resultadosTable.id_usuario,
        total: sum(resultadosTable.puntuacion),
      })
      .from(resultadosTable)
      .groupBy(resultadosTable.id_usuario)
      .orderBy(desc(sum(resultadosTable.puntuacion)));

    const posicion =
      todosResultados.findIndex((r) => r.id_usuario === userId) + 1;

    res.json({
      puntos_totales: Number(stats?.puntos_totales || 0),
      retos_completados: Number(stats?.retos_completados || 0),
      precision_promedio: Number(stats?.precision_promedio || 0),
      tiempo_promedio: Number(stats?.tiempo_promedio || 0),
      racha_dias: perfil?.racha_dias || 0,
      mejor_puntaje: mejorPuntaje,
      posicion_ranking: posicion || 0,
    });
  } catch (err) {
    req.log.error({ err }, "Error al obtener estadisticas");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

export default router;
