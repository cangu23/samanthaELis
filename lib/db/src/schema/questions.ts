// Tabla de preguntas: banco de preguntas para los retos
// Soporta multiples tipos: opcion multiple, verdadero/falso, completar codigo, arrastrar
import {
  pgTable,
  serial,
  integer,
  boolean,
  text,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { modulosTable } from "./modules";
import { nivelesTable } from "./levels";

// Tipos de pregunta disponibles en la plataforma
export const tipoPreguntaEnum = pgEnum("tipo_pregunta", [
  "multiple_choice",  // Opcion multiple con 4 respuestas
  "true_false",       // Verdadero o Falso
  "code_completion",  // Completar un fragmento de codigo
  "drag_drop",        // Arrastrar elementos al lugar correcto
]);

// Niveles de dificultad de las preguntas
export const dificultadEnum = pgEnum("dificultad", [
  "facil",
  "medio",
  "dificil",
]);

export const preguntasTable = pgTable("preguntas", {
  // Identificador unico
  id: serial("id").primaryKey(),
  // Modulo al que pertenece la pregunta
  id_modulo: integer("id_modulo")
    .notNull()
    .references(() => modulosTable.id),
  // Nivel al que pertenece la pregunta
  id_nivel: integer("id_nivel")
    .notNull()
    .references(() => nivelesTable.id),
  // Tipo de pregunta
  tipo: tipoPreguntaEnum("tipo").notNull(),
  // Texto de la pregunta
  texto: text("texto").notNull(),
  // Opciones de respuesta almacenadas como JSON (ej: ["A", "B", "C", "D"])
  opciones: jsonb("opciones"),
  // La respuesta correcta (puede ser texto o indice)
  respuesta_correcta: text("respuesta_correcta").notNull(),
  // Explicacion de por que esa es la respuesta correcta
  explicacion: text("explicacion"),
  // Nivel de dificultad
  dificultad: dificultadEnum("dificultad").notNull(),
  // Puntos que otorga responder correctamente
  puntos: integer("puntos").notNull().default(10),
  // Si la pregunta esta activa
  activa: boolean("activa").notNull().default(true),
});

export const insertPreguntaSchema = createInsertSchema(preguntasTable).omit({
  id: true,
});

export const selectPreguntaSchema = createSelectSchema(preguntasTable);

export type InsertPregunta = z.infer<typeof insertPreguntaSchema>;
export type Pregunta = typeof preguntasTable.$inferSelect;
