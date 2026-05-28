// Tabla de retos predefinidos y retos personalizados por docentes
// Los retos son los desafios que los estudiantes completan para ganar puntos
import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  timestamp,
  text,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { modulosTable } from "./modules";
import { nivelesTable } from "./levels";
import { perfilesTable } from "./profiles";

// Tipos de juego disponibles en la plataforma
export const tipoJuegoEnum = pgEnum("tipo_juego", [
  "quiz",             // Cuestionario clasico de preguntas
  "code_challenge",   // Desafio de codigo - completar o analizar fragmentos
  "security_puzzle",  // Rompecabezas de seguridad informatica
  "drag_drop",        // Arrastrar y soltar elementos al lugar correcto
  "speed_race",       // Carrera de velocidad - responder lo mas rapido posible
  "word_search",      // Sopa de letras interactiva
  "crossword",        // Crucigrama con pistas horizontales y verticales
]);

// Tabla de retos predefinidos por el sistema
export const retosTable = pgTable("retos", {
  id: serial("id").primaryKey(),
  // Nombre del reto
  nombre: varchar("nombre", { length: 150 }).notNull(),
  // Descripcion del reto
  descripcion: text("descripcion"),
  // Tipo de juego del reto
  tipo_juego: tipoJuegoEnum("tipo_juego").notNull(),
  // Modulo al que pertenece
  id_modulo: integer("id_modulo")
    .notNull()
    .references(() => modulosTable.id),
  // Nivel al que pertenece
  id_nivel: integer("id_nivel")
    .notNull()
    .references(() => nivelesTable.id),
  // Tiempo limite en segundos para completar el reto
  tiempo_limite: integer("tiempo_limite").notNull().default(300),
  // Puntaje maximo posible
  puntos_maximos: integer("puntos_maximos").notNull().default(100),
  // Numero de preguntas en el reto
  numero_preguntas: integer("numero_preguntas").notNull().default(10),
  // Si el reto esta activo
  activo: boolean("activo").notNull().default(true),
  // Fecha de creacion
  creado_en: timestamp("creado_en").notNull().defaultNow(),
});

// Tabla de retos personalizados creados por los docentes
export const retosPersonalizadosTable = pgTable("retos_personalizados", {
  id: serial("id").primaryKey(),
  // Docente que creo el reto
  id_docente: integer("id_docente")
    .notNull()
    .references(() => perfilesTable.id),
  // Nombre del reto personalizado
  nombre: varchar("nombre", { length: 150 }).notNull(),
  // Descripcion
  descripcion: text("descripcion"),
  // Tipo de juego
  tipo_juego: tipoJuegoEnum("tipo_juego").notNull(),
  // Modulo al que pertenece
  id_modulo: integer("id_modulo")
    .notNull()
    .references(() => modulosTable.id),
  // Nivel al que pertenece
  id_nivel: integer("id_nivel")
    .notNull()
    .references(() => nivelesTable.id),
  // Puntaje maximo
  puntos_maximos: integer("puntos_maximos").notNull().default(100),
  // Numero de preguntas
  numero_preguntas: integer("numero_preguntas").notNull().default(10),
  // Tiempo limite en segundos
  tiempo_limite: integer("tiempo_limite").notNull().default(300),
  // Si el reto esta activo
  activo: boolean("activo").notNull().default(true),
  publicado: boolean("publicado").notNull().default(false),
  creado_en: timestamp("creado_en").notNull().defaultNow(),
});

// Tabla de relacion entre retos personalizados y preguntas
export const retosPersonalizadosPreguntasTable = pgTable(
  "retos_personalizados_preguntas",
  {
    id: serial("id").primaryKey(),
    id_reto: integer("id_reto")
      .notNull()
      .references(() => retosPersonalizadosTable.id),
    id_pregunta: integer("id_pregunta").notNull(),
    // Texto de la pregunta del reto personalizado
    texto: text("texto").notNull(),
    // Tipo de pregunta
    tipo: varchar("tipo", { length: 50 }).notNull(),
    // Opciones como JSON
    opciones: text("opciones"),
    // Respuesta correcta
    respuesta_correcta: text("respuesta_correcta").notNull(),
    // Explicacion
    explicacion: text("explicacion"),
    // Dificultad
    dificultad: varchar("dificultad", { length: 20 }).notNull(),
    // Puntos
    puntos: integer("puntos").notNull().default(10),
  }
);

export const insertRetoSchema = createInsertSchema(retosTable).omit({
  id: true,
  creado_en: true,
});

export const insertRetosPersonalizadosSchema = createInsertSchema(
  retosPersonalizadosTable
).omit({
  id: true,
  creado_en: true,
});

export type InsertReto = z.infer<typeof insertRetoSchema>;
export type Reto = typeof retosTable.$inferSelect;
export type InsertRetoPersonalizado = z.infer<typeof insertRetosPersonalizadosSchema>;
export type RetoPersonalizado = typeof retosPersonalizadosTable.$inferSelect;
