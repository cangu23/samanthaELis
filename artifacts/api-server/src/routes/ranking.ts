// Rutas del ranking: clasificacion global y por modulo de todos los estudiantes
// El ranking muestra puntos, precision, tiempo y mas estadisticas con colores
import { Router } from "express";
import { db } from "@workspace/db";
import { resultadosTable, perfilesTable } from "@workspace/db";
import { eq, desc, sum, avg, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /ranking - Obtener el ranking global de todos los estudiantes
router.get("/ranking", requireAuth, async (req, res) => {
  try {
    // Agrupa resultados por usuario y calcula estadisticas
    const rankingData = await db
      .select({
        id_usuario: resultadosTable.id_usuario,
        puntos_totales: sum(resultadosTable.puntuacion),
        retos_completados: count(),
        precision_promedio: avg(resultadosTable.precision),
        tiempo_promedio: avg(resultadosTable.tiempo_total),
        respuestas_correctas: sum(resultadosTable.respuestas_correctas),
        respuestas_incorrectas: sum(resultadosTable.respuestas_incorrectas),
      })
      .from(resultadosTable)
      .groupBy(resultadosTable.id_usuario)
      .orderBy(desc(sum(resultadosTable.puntuacion)));

    // Para cada entrada del ranking, agrega informacion del perfil
    const rankingConPerfiles = await Promise.all(
      rankingData.map(async (entry, index) => {
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
          .where(eq(perfilesTable.id, entry.id_usuario));

        // Solo incluye estudiantes en el ranking
        if (!perfil || perfil.rol !== "estudiante") return null;

        return {
          posicion: index + 1,
          usuario_id: perfil.id,
          nombre: perfil.nombre ?? perfil.usuario,
          usuario: perfil.usuario,
          grado_bachillerato: perfil.grado_bachillerato,
          rol: perfil.rol,
          avatar_url: perfil.avatar_url,
          racha_dias: perfil.racha_dias,
          puntos_totales: Number(entry.puntos_totales || 0),
          retos_completados: Number(entry.retos_completados || 0),
          precision_promedio: Number(entry.precision_promedio || 0),
          tiempo_promedio: Number(entry.tiempo_promedio || 0),
          respuestas_correctas: Number(entry.respuestas_correctas || 0),
          respuestas_incorrectas: Number(entry.respuestas_incorrectas || 0),
        };
      })
    );

    // Filtra nulos (docentes) y renumera posiciones
    const rankingFiltrado = rankingConPerfiles
      .filter(Boolean)
      .map((entry, index) => ({ ...entry!, posicion: index + 1 }));

    res.json(rankingFiltrado);
  } catch (err) {
    req.log.error({ err }, "Error al obtener ranking");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// GET /ranking/module/:moduleId - Ranking filtrado por modulo especifico
router.get("/ranking/module/:moduleId", requireAuth, async (req, res) => {
  try {
    const moduleId = Number(req.params.moduleId);

    // Nota: para filtrar por modulo necesitamos hacer join con retos
    // Por ahora retorna el ranking global (se puede refinar con join a futuro)
    const rankingData = await db
      .select({
        id_usuario: resultadosTable.id_usuario,
        puntos_totales: sum(resultadosTable.puntuacion),
        retos_completados: count(),
        precision_promedio: avg(resultadosTable.precision),
        tiempo_promedio: avg(resultadosTable.tiempo_total),
        respuestas_correctas: sum(resultadosTable.respuestas_correctas),
        respuestas_incorrectas: sum(resultadosTable.respuestas_incorrectas),
      })
      .from(resultadosTable)
      .groupBy(resultadosTable.id_usuario)
      .orderBy(desc(sum(resultadosTable.puntuacion)));

    const rankingConPerfiles = await Promise.all(
      rankingData.map(async (entry, index) => {
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
          .where(eq(perfilesTable.id, entry.id_usuario));

        if (!perfil || perfil.rol !== "estudiante") return null;

        // Filtra por grado de bachillerato que coincide con el modulo
        if (perfil.grado_bachillerato !== moduleId) return null;

        return {
          posicion: index + 1,
          usuario_id: perfil.id,
          nombre: perfil.nombre ?? perfil.usuario,
          usuario: perfil.usuario,
          grado_bachillerato: perfil.grado_bachillerato,
          rol: perfil.rol,
          avatar_url: perfil.avatar_url,
          racha_dias: perfil.racha_dias,
          puntos_totales: Number(entry.puntos_totales || 0),
          retos_completados: Number(entry.retos_completados || 0),
          precision_promedio: Number(entry.precision_promedio || 0),
          tiempo_promedio: Number(entry.tiempo_promedio || 0),
          respuestas_correctas: Number(entry.respuestas_correctas || 0),
          respuestas_incorrectas: Number(entry.respuestas_incorrectas || 0),
        };
      })
    );

    const rankingFiltrado = rankingConPerfiles
      .filter(Boolean)
      .map((entry, index) => ({ ...entry!, posicion: index + 1 }));

    res.json(rankingFiltrado);
  } catch (err) {
    req.log.error({ err }, "Error al obtener ranking por modulo");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

export default router;
