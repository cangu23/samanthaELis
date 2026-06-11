import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(cors({
  // Permitimos el dominio de Vercel y local para pruebas
  origin: [
    process.env.FRONTEND_URL || "*", 
    /\.vercel\.app$/, // Esto acepta cualquier subdominio de vercel.app de tu cuenta
    "http://localhost:5173"
  ],
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta raíz para evitar el error 404 en el panel de Render
app.get("/", (_req, res) => {
  res.send("<h1>🧠 Cerebrito API</h1><p>El servidor está funcionando correctamente. Para ver la aplicación visual, usa tu URL de Vercel.</p>");
});

app.use("/api", router);

export default app;
