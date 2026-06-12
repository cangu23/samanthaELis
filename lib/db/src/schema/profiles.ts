// Tabla de perfiles: representa tanto estudiantes como docentes
// Contiene toda la informacion del usuario incluyendo su rol, grado y estadisticas
import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enum para el rol del usuario: solo puede ser estudiante o docente
export const rolEnum = pgEnum("rol", ["estudiante", "docente"]);

export const perfilesTable = pgTable("perfiles", {
  // Identificador unico autoincremental
  id: serial("id").primaryKey(),
  // Nombre completo del usuario
  nombre: varchar("nombre", { length: 150 }).notNull(),
  // Cédula de identidad
  cedula: varchar("cedula", { length: 20 }).unique(),
  // ID de Google para login social
  google_id: varchar("google_id", { length: 255 }).unique(),
  // Nombre de usuario para login - debe ser unico
  usuario: varchar("usuario", { length: 50 }).notNull().unique(),
  // Contrasena hasheada con bcrypt
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  // Rol del usuario: estudiante o docente
  rol: rolEnum("rol").notNull(),
  // Grado de bachillerato: 1, 2 o 3 (solo para estudiantes)
  grado_bachillerato: integer("grado_bachillerato"),
  // URL del avatar del usuario
  avatar_url: varchar("avatar_url", { length: 255 }),
  // Puntos acumulados en todos los retos
  puntos_totales: integer("puntos_totales").notNull().default(0),
  // Cantidad de retos completados
  retos_completados: integer("retos_completados").notNull().default(0),
  // Dias consecutivos de uso de la plataforma
  racha_dias: integer("racha_dias").notNull().default(0),
  // Ultimo acceso para calcular racha
  ultimo_acceso: timestamp("ultimo_acceso"),
  // Fecha de creacion del perfil
  creado_en: timestamp("creado_en").notNull().defaultNow(),
  // Ultimo nivel que intento el estudiante
  ultimo_nivel_intento: varchar("ultimo_nivel_intento", { length: 50 }),
  mejor_puntaje_por_modulo: jsonb("mejor_puntaje_por_modulo").default({}),
  email: varchar("email", { length: 255 }),
  reset_token: varchar("reset_token", { length: 255 }),
  reset_token_expires_at: timestamp("reset_token_expires_at"),
});

// Schema de insercion: excluye id y campos con valores por defecto
export const insertPerfilSchema = createInsertSchema(perfilesTable).omit({
  id: true,
  puntos_totales: true,
  retos_completados: true,
  racha_dias: true,
  creado_en: true,
});

export const selectPerfilSchema = createSelectSchema(perfilesTable);

export type InsertPerfil = z.infer<typeof insertPerfilSchema>;
export type Perfil = typeof perfilesTable.$inferSelect;
