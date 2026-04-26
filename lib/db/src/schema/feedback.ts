// Tabla de feedback_docente: retroalimentacion que los docentes envian a estudiantes
// Es parte del sistema de bandeja de entrada (inbox) del estudiante
import {
  pgTable,
  serial,
  integer,
  boolean,
  timestamp,
  text,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { perfilesTable } from "./profiles";

// Tipos de feedback que un docente puede enviar
export const tipoFeedbackEnum = pgEnum("tipo_feedback", [
  "mejora",        // Sugerencia de mejora
  "felicitacion",  // Felicitacion por buen desempeno
  "advertencia",   // Advertencia por bajo rendimiento
  "general",       // Mensaje general
]);

export const feedbackDocenteTable = pgTable("feedback_docente", {
  id: serial("id").primaryKey(),
  // Docente que envia el feedback
  id_docente: integer("id_docente")
    .notNull()
    .references(() => perfilesTable.id),
  // Estudiante que recibe el feedback
  id_estudiante: integer("id_estudiante")
    .notNull()
    .references(() => perfilesTable.id),
  // Contenido del mensaje
  contenido: text("contenido").notNull(),
  // Tipo de feedback
  tipo: tipoFeedbackEnum("tipo").notNull(),
  // Si el estudiante lo leyo
  leido: boolean("leido").notNull().default(false),
  // Fecha de creacion
  creado_en: timestamp("creado_en").notNull().defaultNow(),
});

export const insertFeedbackSchema = createInsertSchema(feedbackDocenteTable).omit({
  id: true,
  creado_en: true,
});

export const selectFeedbackSchema = createSelectSchema(feedbackDocenteTable);

export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type FeedbackDocente = typeof feedbackDocenteTable.$inferSelect;
