// Tabla de modulos: representa los 3 modulos educativos (1ro, 2do, 3ro de bachillerato)
// Cada modulo corresponde a un ano de la especialidad de informatica
import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  timestamp,
  text,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const modulosTable = pgTable("modulos", {
  // Identificador unico autoincremental
  id: serial("id").primaryKey(),
  // Nombre del modulo (ej: "Fundamentos de Programacion")
  nombre: varchar("nombre", { length: 150 }).notNull(),
  // Ano de bachillerato al que corresponde: 1, 2 o 3
  anio_bachillerato: integer("anio_bachillerato").notNull(),
  // Descripcion detallada del modulo
  descripcion: text("descripcion"),
  // Color en formato HEX para la interfaz (ej: "#0EA5E9")
  color: varchar("color", { length: 20 }),
  // Nombre del icono para la interfaz
  icono: varchar("icono", { length: 100 }),
  // Si el modulo esta activo o no
  activo: boolean("activo").notNull().default(true),
  // Fecha de creacion
  creado_en: timestamp("creado_en").notNull().defaultNow(),
});

export const insertModuloSchema = createInsertSchema(modulosTable).omit({
  id: true,
  creado_en: true,
});

export const selectModuloSchema = createSelectSchema(modulosTable);

export type InsertModulo = z.infer<typeof insertModuloSchema>;
export type Modulo = typeof modulosTable.$inferSelect;
