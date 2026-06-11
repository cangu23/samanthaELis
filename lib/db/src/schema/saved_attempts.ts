// Tabla de intentos_guardados: guarda el progreso cuando un estudiante abandona un reto
// Permite retomar el reto desde donde lo dejo
import {
  pgTable,
  serial,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { perfilesTable } from "./profiles";

export const intentosGuardadosTable = pgTable("intentos_guardados", {
  id: serial("id").primaryKey(),
  // Usuario dueno del intento guardado
  id_usuario: integer("id_usuario")
    .notNull()
    .references(() => perfilesTable.id),
  // ID del reto (puede ser personalizado o predefinido)
  id_reto: integer("id_reto").notNull(),
  // Estado completo del juego en formato JSON (pregunta actual, respuestas, etc.)
  progreso_json: jsonb("progreso_json").notNull().default({}),
  // Respuestas dadas hasta el momento en formato JSON
  respuestas_json: jsonb("respuestas_json").notNull().default({}),
  // Indice de la pregunta actual (0-based)
  pregunta_actual: integer("pregunta_actual").notNull().default(0),
  // Puntuacion parcial acumulada hasta el momento de abandono
  puntuacion_parcial: integer("puntuacion_parcial").notNull().default(0),
  // Tiempo transcurrido en segundos al momento de abandono
  tiempo_transcurrido: integer("tiempo_transcurrido").notNull().default(0),
  // Fecha de creacion del intento guardado
  creado_en: timestamp("creado_en").notNull().defaultNow(),
  // Fecha de ultima actualizacion
  actualizado_en: timestamp("actualizado_en").notNull().defaultNow(),
});

export const insertIntentoGuardadoSchema = createInsertSchema(
  intentosGuardadosTable
).omit({
  id: true,
  creado_en: true,
  actualizado_en: true,
});

export const selectIntentoGuardadoSchema = createSelectSchema(
  intentosGuardadosTable
);

export type InsertIntentoGuardado = z.infer<typeof insertIntentoGuardadoSchema>;
export type IntentoGuardado = typeof intentosGuardadosTable.$inferSelect;
