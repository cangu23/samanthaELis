// Utilidades de autenticacion: JWT y middleware de verificacion
// Usa jsonwebtoken para firmar tokens y verifica el rol del usuario
import jwt from "jsonwebtoken";
import { type Request, type Response, type NextFunction } from "express";
import { db } from "@workspace/db";
import { perfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

// Clave secreta para firmar los JWT - en produccion debe ser un secreto seguro
const JWT_SECRET = process.env.SECRET_KEY || process.env.SESSION_SECRET || "cerebrito_secret_2024";

// Payload que va dentro del token JWT
export interface JwtPayload {
  userId: number;
  usuario: string;
  rol: string;
}

// Extiende Request para incluir el usuario autenticado
export interface AuthRequest extends Request {
  user?: {
    id: number;
    usuario: string;
    rol: string;
    grado_bachillerato: number | null;
  };
}

// Genera un token JWT con una validez de 7 dias
export function generarToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// Middleware que verifica el token JWT en el header Authorization
export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Extrae el token del header Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized", message: "Token requerido" });
    return;
  }

  const token = authHeader.substring(7);

  try {
    // Verifica y decodifica el token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Busca el usuario en la base de datos para tener datos frescos
    const [user] = await db
      .select({
        id: perfilesTable.id,
        usuario: perfilesTable.usuario,
        rol: perfilesTable.rol,
        grado_bachillerato: perfilesTable.grado_bachillerato,
      })
      .from(perfilesTable)
      .where(eq(perfilesTable.id, decoded.userId));

    if (!user) {
      res.status(401).json({ error: "unauthorized", message: "Usuario no encontrado" });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "unauthorized", message: "Token invalido o expirado" });
  }
}

// Middleware que verifica que el usuario tenga rol de docente
export function requireDocente(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.rol !== "docente") {
    res.status(403).json({ error: "forbidden", message: "Solo los docentes pueden realizar esta accion" });
    return;
  }
  next();
}
