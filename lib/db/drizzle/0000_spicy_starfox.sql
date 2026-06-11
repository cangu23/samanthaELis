CREATE TYPE "public"."rol" AS ENUM('estudiante', 'docente');--> statement-breakpoint
CREATE TYPE "public"."dificultad" AS ENUM('facil', 'medio', 'dificil');--> statement-breakpoint
CREATE TYPE "public"."tipo_pregunta" AS ENUM('multiple_choice', 'true_false', 'code_completion', 'drag_drop');--> statement-breakpoint
CREATE TYPE "public"."tipo_juego" AS ENUM('quiz', 'code_challenge', 'security_puzzle', 'drag_drop', 'speed_race', 'word_search', 'crossword');--> statement-breakpoint
CREATE TYPE "public"."tipo_alerta" AS ENUM('bajo_rendimiento', 'nivel_completado', 'logro', 'sistema');--> statement-breakpoint
CREATE TYPE "public"."tipo_feedback" AS ENUM('mejora', 'felicitacion', 'advertencia', 'general');--> statement-breakpoint
CREATE TABLE "perfiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(150) NOT NULL,
	"usuario" varchar(50) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"rol" "rol" NOT NULL,
	"grado_bachillerato" integer,
	"avatar_url" varchar(255),
	"puntos_totales" integer DEFAULT 0 NOT NULL,
	"retos_completados" integer DEFAULT 0 NOT NULL,
	"racha_dias" integer DEFAULT 0 NOT NULL,
	"ultimo_acceso" timestamp,
	"creado_en" timestamp DEFAULT now() NOT NULL,
	"ultimo_nivel_intento" varchar(50),
	"mejor_puntaje_por_modulo" jsonb,
	"email" varchar(255),
	"reset_token" varchar(255),
	"reset_token_expires_at" timestamp,
	CONSTRAINT "perfiles_usuario_unique" UNIQUE("usuario")
);
--> statement-breakpoint
CREATE TABLE "modulos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(150) NOT NULL,
	"anio_bachillerato" integer NOT NULL,
	"descripcion" text,
	"color" varchar(20),
	"icono" varchar(100),
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "niveles" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_modulo" integer NOT NULL,
	"nombre" varchar(150) NOT NULL,
	"orden" integer NOT NULL,
	"descripcion" text,
	"puntos_por_reto" integer DEFAULT 100 NOT NULL,
	"activo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preguntas" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_modulo" integer NOT NULL,
	"id_nivel" integer NOT NULL,
	"tipo" "tipo_pregunta" NOT NULL,
	"texto" text NOT NULL,
	"opciones" jsonb,
	"respuesta_correcta" text NOT NULL,
	"explicacion" text,
	"dificultad" "dificultad" NOT NULL,
	"puntos" integer DEFAULT 10 NOT NULL,
	"activa" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retos_personalizados_preguntas" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_reto" integer NOT NULL,
	"id_pregunta" integer NOT NULL,
	"texto" text NOT NULL,
	"tipo" varchar(50) NOT NULL,
	"opciones" text,
	"respuesta_correcta" text NOT NULL,
	"explicacion" text,
	"dificultad" varchar(20) NOT NULL,
	"puntos" integer DEFAULT 10 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retos_personalizados" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_docente" integer NOT NULL,
	"nombre" varchar(150) NOT NULL,
	"descripcion" text,
	"tipo_juego" "tipo_juego" NOT NULL,
	"id_modulo" integer NOT NULL,
	"id_nivel" integer NOT NULL,
	"puntos_maximos" integer DEFAULT 100 NOT NULL,
	"numero_preguntas" integer DEFAULT 10 NOT NULL,
	"tiempo_limite" integer DEFAULT 300 NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"publicado" boolean DEFAULT false NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(150) NOT NULL,
	"descripcion" text,
	"tipo_juego" "tipo_juego" NOT NULL,
	"id_modulo" integer NOT NULL,
	"id_nivel" integer NOT NULL,
	"tiempo_limite" integer DEFAULT 300 NOT NULL,
	"puntos_maximos" integer DEFAULT 100 NOT NULL,
	"numero_preguntas" integer DEFAULT 10 NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resultados" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_usuario" integer NOT NULL,
	"id_reto" integer NOT NULL,
	"is_custom" boolean DEFAULT false NOT NULL,
	"puntuacion" integer DEFAULT 0 NOT NULL,
	"puntos_maximos" integer NOT NULL,
	"precision" real DEFAULT 0 NOT NULL,
	"tiempo_total" integer DEFAULT 0 NOT NULL,
	"detalles" jsonb,
	"completado" boolean DEFAULT false NOT NULL,
	"fecha" timestamp DEFAULT now() NOT NULL,
	"tiempo_respuesta" integer DEFAULT 0 NOT NULL,
	"respuestas_correctas" integer DEFAULT 0 NOT NULL,
	"respuestas_incorrectas" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alertas" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_usuario" integer NOT NULL,
	"descripcion" text NOT NULL,
	"tipo" "tipo_alerta" NOT NULL,
	"leida" boolean DEFAULT false NOT NULL,
	"fecha" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recomendaciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_usuario" integer NOT NULL,
	"descripcion" text NOT NULL,
	"motivo" text,
	"tipo" text DEFAULT 'general' NOT NULL,
	"leida" boolean DEFAULT false NOT NULL,
	"fecha" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_docente" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_docente" integer NOT NULL,
	"id_estudiante" integer NOT NULL,
	"contenido" text NOT NULL,
	"tipo" "tipo_feedback" NOT NULL,
	"leido" boolean DEFAULT false NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intentos_guardados" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_usuario" integer NOT NULL,
	"id_reto" integer NOT NULL,
	"progreso_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"respuestas_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"pregunta_actual" integer DEFAULT 0 NOT NULL,
	"puntuacion_parcial" integer DEFAULT 0 NOT NULL,
	"tiempo_transcurrido" integer DEFAULT 0 NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL,
	"actualizado_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mensajes" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_remitente" integer NOT NULL,
	"id_destinatario" integer NOT NULL,
	"contenido" text NOT NULL,
	"leido" boolean DEFAULT false NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participantes_sesion" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_sesion" integer NOT NULL,
	"id_usuario" integer NOT NULL,
	"puntuacion" integer DEFAULT 0 NOT NULL,
	"tiempo_total" integer DEFAULT 0 NOT NULL,
	"respuestas_correctas" integer DEFAULT 0 NOT NULL,
	"total_preguntas" integer DEFAULT 0 NOT NULL,
	"completado" boolean DEFAULT false NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sesiones_competencia" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(8) NOT NULL,
	"nombre" text NOT NULL,
	"id_reto" integer NOT NULL,
	"id_docente" integer NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sesiones_competencia_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
ALTER TABLE "niveles" ADD CONSTRAINT "niveles_id_modulo_modulos_id_fk" FOREIGN KEY ("id_modulo") REFERENCES "public"."modulos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preguntas" ADD CONSTRAINT "preguntas_id_modulo_modulos_id_fk" FOREIGN KEY ("id_modulo") REFERENCES "public"."modulos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preguntas" ADD CONSTRAINT "preguntas_id_nivel_niveles_id_fk" FOREIGN KEY ("id_nivel") REFERENCES "public"."niveles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retos_personalizados_preguntas" ADD CONSTRAINT "retos_personalizados_preguntas_id_reto_retos_personalizados_id_fk" FOREIGN KEY ("id_reto") REFERENCES "public"."retos_personalizados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retos_personalizados" ADD CONSTRAINT "retos_personalizados_id_docente_perfiles_id_fk" FOREIGN KEY ("id_docente") REFERENCES "public"."perfiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retos_personalizados" ADD CONSTRAINT "retos_personalizados_id_modulo_modulos_id_fk" FOREIGN KEY ("id_modulo") REFERENCES "public"."modulos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retos_personalizados" ADD CONSTRAINT "retos_personalizados_id_nivel_niveles_id_fk" FOREIGN KEY ("id_nivel") REFERENCES "public"."niveles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retos" ADD CONSTRAINT "retos_id_modulo_modulos_id_fk" FOREIGN KEY ("id_modulo") REFERENCES "public"."modulos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retos" ADD CONSTRAINT "retos_id_nivel_niveles_id_fk" FOREIGN KEY ("id_nivel") REFERENCES "public"."niveles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resultados" ADD CONSTRAINT "resultados_id_usuario_perfiles_id_fk" FOREIGN KEY ("id_usuario") REFERENCES "public"."perfiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_id_usuario_perfiles_id_fk" FOREIGN KEY ("id_usuario") REFERENCES "public"."perfiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recomendaciones" ADD CONSTRAINT "recomendaciones_id_usuario_perfiles_id_fk" FOREIGN KEY ("id_usuario") REFERENCES "public"."perfiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_docente" ADD CONSTRAINT "feedback_docente_id_docente_perfiles_id_fk" FOREIGN KEY ("id_docente") REFERENCES "public"."perfiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_docente" ADD CONSTRAINT "feedback_docente_id_estudiante_perfiles_id_fk" FOREIGN KEY ("id_estudiante") REFERENCES "public"."perfiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intentos_guardados" ADD CONSTRAINT "intentos_guardados_id_usuario_perfiles_id_fk" FOREIGN KEY ("id_usuario") REFERENCES "public"."perfiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_id_remitente_perfiles_id_fk" FOREIGN KEY ("id_remitente") REFERENCES "public"."perfiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_id_destinatario_perfiles_id_fk" FOREIGN KEY ("id_destinatario") REFERENCES "public"."perfiles"("id") ON DELETE no action ON UPDATE no action;