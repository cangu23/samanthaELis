// Router principal del servidor - registra todas las rutas de la plataforma Cerebrito
// Cada modulo de rutas maneja una parte especifica de la funcionalidad
import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import authRouter from "./auth";
import modulesRouter from "./modules";
import challengesRouter from "./challenges";
import resultsRouter from "./results";
import rankingRouter from "./ranking";
import inboxRouter from "./inbox";
import feedbackRouter from "./feedback";
import savedAttemptsRouter from "./saved_attempts";
import profilesRouter from "./profiles";
import messagesRouter from "./messages";

const router: IRouter = Router();

// Healthcheck
router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// Rutas de autenticacion: register, login, logout, me
router.use(authRouter);

// Rutas de modulos educativos y sus niveles/retos
router.use(modulesRouter);

// Rutas de retos (predefinidos y personalizados)
router.use(challengesRouter);

// Rutas de resultados y estadisticas del usuario
router.use(resultsRouter);

// Rutas del ranking global y por modulo
router.use(rankingRouter);

// Rutas de bandeja de entrada: alertas, recomendaciones, feedback
router.use(inboxRouter);

// Rutas de feedback de docente hacia estudiante
router.use(feedbackRouter);

// Rutas de intentos guardados (progreso al abandonar un reto)
router.use(savedAttemptsRouter);

// Rutas de perfiles de usuario
router.use(profilesRouter);

// Rutas de mensajes directos entre usuarios (bidireccional con destinatario elegido)
router.use(messagesRouter);

export default router;
