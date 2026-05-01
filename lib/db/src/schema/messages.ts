// Tabla de mensajes directos entre usuarios (bidireccional)
// Docentes pueden enviar a estudiantes y viceversa, con destinatario elegido
import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { perfilesTable } from "./profiles";

export const mensajesTable = pgTable("mensajes", {
  id: serial("id").primaryKey(),
  id_remitente: integer("id_remitente")
    .notNull()
    .references(() => perfilesTable.id),
  id_destinatario: integer("id_destinatario")
    .notNull()
    .references(() => perfilesTable.id),
  contenido: text("contenido").notNull(),
  leido: boolean("leido").notNull().default(false),
  creado_en: timestamp("creado_en").notNull().defaultNow(),
});

export const insertMensajeSchema = createInsertSchema(mensajesTable).omit({
  id: true,
  creado_en: true,
});

export type InsertMensaje = z.infer<typeof insertMensajeSchema>;
export type Mensaje = typeof mensajesTable.$inferSelect;
