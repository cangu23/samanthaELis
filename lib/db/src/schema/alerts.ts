// Tabla de alertas: notificaciones automaticas del sistema para los estudiantes
// Incluye alertas de bajo rendimiento, logros y mensajes del sistema
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
import { z } from "zod";
import { perfilesTable } from "./profiles";

// Tipos de alerta del sistema
export const tipoAlertaEnum = pgEnum("tipo_alerta", [
  "bajo_rendimiento",   // El estudiante tiene bajo rendimiento
  "nivel_completado",   // Completo un nivel exitosamente
  "logro",              // Obtuvo un logro especial
  "sistema",            // Mensaje general del sistema
]);

export const alertasTable = pgTable("alertas", {
  id: serial("id").primaryKey(),
  // Usuario destinatario de la alerta
  id_usuario: integer("id_usuario")
    .notNull()
    .references(() => perfilesTable.id),
  // Descripcion de la alerta
  descripcion: text("descripcion").notNull(),
  // Tipo de alerta
  tipo: tipoAlertaEnum("tipo").notNull(),
  // Si la alerta fue leida
  leida: boolean("leida").notNull().default(false),
  // Fecha de creacion
  fecha: timestamp("fecha").notNull().defaultNow(),
});

// Tabla de recomendaciones: sugerencias personalizadas del sistema
export const recomendacionesTable = pgTable("recomendaciones", {
  id: serial("id").primaryKey(),
  // Usuario destinatario
  id_usuario: integer("id_usuario")
    .notNull()
    .references(() => perfilesTable.id),
  // Descripcion de la recomendacion
  descripcion: text("descripcion").notNull(),
  // Motivo de la recomendacion
  motivo: text("motivo"),
  // Tipo de recomendacion
  tipo: text("tipo").notNull().default("general"),
  // Si fue leida
  leida: boolean("leida").notNull().default(false),
  // Fecha de creacion
  fecha: timestamp("fecha").notNull().defaultNow(),
});

export const insertAlertaSchema = createInsertSchema(alertasTable).omit({
  id: true,
  fecha: true,
});

export const insertRecomendacionSchema = createInsertSchema(
  recomendacionesTable
).omit({
  id: true,
  fecha: true,
});

export type InsertAlerta = z.infer<typeof insertAlertaSchema>;
export type Alerta = typeof alertasTable.$inferSelect;
export type InsertRecomendacion = z.infer<typeof insertRecomendacionSchema>;
export type Recomendacion = typeof recomendacionesTable.$inferSelect;
