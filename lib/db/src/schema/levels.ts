// Tabla de niveles: representa los niveles de dificultad dentro de cada modulo
// Cada modulo tiene varios niveles ordenados de menor a mayor dificultad
import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  text,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { modulosTable } from "./modules";

export const nivelesTable = pgTable("niveles", {
  // Identificador unico
  id: serial("id").primaryKey(),
  // Referencia al modulo al que pertenece este nivel
  id_modulo: integer("id_modulo")
    .notNull()
    .references(() => modulosTable.id),
  // Nombre del nivel (ej: "Nivel 1 - Basico")
  nombre: varchar("nombre", { length: 150 }).notNull(),
  // Orden del nivel dentro del modulo (1, 2, 3...)
  orden: integer("orden").notNull(),
  // Descripcion del nivel
  descripcion: text("descripcion"),
  // Puntos que otorga completar un reto de este nivel
  puntos_por_reto: integer("puntos_por_reto").notNull().default(100),
  // Si el nivel esta activo
  activo: boolean("activo").notNull().default(true),
});

export const insertNivelSchema = createInsertSchema(nivelesTable).omit({
  id: true,
});

export const selectNivelSchema = createSelectSchema(nivelesTable);

export type InsertNivel = z.infer<typeof insertNivelSchema>;
export type Nivel = typeof nivelesTable.$inferSelect;
