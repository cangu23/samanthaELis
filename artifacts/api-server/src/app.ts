import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Configuración de CORS
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      "http://localhost:5173",
      "http://localhost:3000"
    ].filter(Boolean) as string[];

    // Permite el origen si está en la lista o si viene de un despliegue de Vercel
    if (!origin || allowedOrigins.includes(origin) || origin.match(/vercel\.app$/)) {
      callback(null, true);
    } else {
      callback(new Error("No permitido por CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Seguridad: Límite de tamaño para el cuerpo de las peticiones
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Ruta raíz para evitar el error 404 en el panel de Render
app.get("/", (_req, res) => {
  res.status(200).send("<h1>🧠 Cerebrito API</h1><p>El servidor está funcionando correctamente. Para ver la aplicación visual, usa tu URL de Vercel.</p>");
});

app.use("/api", router);

// Manejo de rutas 404 para la API
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "not_found", message: "El endpoint solicitado no existe" });
});

// Manejador de errores global
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  logger.error({ err }, "Error no manejado detectado");
  res.status(status).json({ error: "server_error", message: err.message || "Error interno del servidor" });
});

export default app;
