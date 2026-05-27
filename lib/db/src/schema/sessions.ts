// Tablas de sesiones de competencia: el docente crea una sesion con un codigo unico
// Los estudiantes se unen con el link y compiten en el mismo reto simultaneamente
import { pgTable, serial, text, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";

export const sesionesCompetenciaTable = pgTable("sesiones_competencia", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 8 }).notNull().unique(),
  nombre: text("nombre").notNull(),
  id_reto: integer("id_reto").notNull(),
  id_docente: integer("id_docente").notNull(),
  activa: boolean("activa").notNull().default(true),
  creado_en: timestamp("creado_en").defaultNow().notNull(),
});

export const participantesSesionTable = pgTable("participantes_sesion", {
  id: serial("id").primaryKey(),
  id_sesion: integer("id_sesion").notNull(),
  id_usuario: integer("id_usuario").notNull(),
  puntuacion: integer("puntuacion").notNull().default(0),
  tiempo_total: integer("tiempo_total").notNull().default(0),
  respuestas_correctas: integer("respuestas_correctas").notNull().default(0),
  total_preguntas: integer("total_preguntas").notNull().default(0),
  completado: boolean("completado").notNull().default(false),
  creado_en: timestamp("creado_en").defaultNow().notNull(),
});
