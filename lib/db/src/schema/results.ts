// Tabla de resultados: guarda cada intento completado o abandonado de un reto
// Es la base del sistema de ranking y seguimiento del progreso
import {
  pgTable,
  serial,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { perfilesTable } from "./profiles";

export const resultadosTable = pgTable("resultados", {
  id: serial("id").primaryKey(),
  // Usuario que realizo el reto
  id_usuario: integer("id_usuario")
    .notNull()
    .references(() => perfilesTable.id),
  // ID del reto (puede ser reto normal o personalizado segun is_custom)
  id_reto: integer("id_reto").notNull(),
  // Si es un reto personalizado (true) o predefinido (false)
  is_custom: boolean("is_custom").notNull().default(false),
  // Puntaje obtenido en este intento
  puntuacion: integer("puntuacion").notNull().default(0),
  // Puntaje maximo posible del reto
  puntos_maximos: integer("puntos_maximos").notNull(),
  // Precision: porcentaje de respuestas correctas (0.0 a 1.0)
  precision: real("precision").notNull().default(0),
  // Tiempo total empleado en segundos
  tiempo_total: integer("tiempo_total").notNull().default(0),
  // Detalles adicionales del resultado en formato JSON
  detalles: jsonb("detalles"),
  // Si el reto fue completado (true) o abandonado (false)
  completado: boolean("completado").notNull().default(false),
  // Fecha en que se realizo el intento
  fecha: timestamp("fecha").notNull().defaultNow(),
  // Tiempo promedio de respuesta por pregunta en segundos
  tiempo_respuesta: integer("tiempo_respuesta").notNull().default(0),
  // Numero de respuestas correctas
  respuestas_correctas: integer("respuestas_correctas").notNull().default(0),
  // Numero de respuestas incorrectas
  respuestas_incorrectas: integer("respuestas_incorrectas").notNull().default(0),
});

export const insertResultadoSchema = createInsertSchema(resultadosTable).omit({
  id: true,
  fecha: true,
});

export const selectResultadoSchema = createSelectSchema(resultadosTable);

export type InsertResultado = z.infer<typeof insertResultadoSchema>;
export type Resultado = typeof resultadosTable.$inferSelect;
