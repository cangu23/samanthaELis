// Rutas de mensajes directos entre usuarios
// Tanto docentes como estudiantes pueden enviar y recibir mensajes eligiendo destinatario
import { Router } from "express";
import { db } from "@workspace/db";
import { mensajesTable, perfilesTable } from "@workspace/db";
import { eq, or, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

// GET /messages - Obtener todos los mensajes del usuario (enviados y recibidos)
router.get("/messages", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const mensajes = await db
      .select()
      .from(mensajesTable)
      .where(
        or(
          eq(mensajesTable.id_remitente, userId),
          eq(mensajesTable.id_destinatario, userId)
        )
      )
      .orderBy(desc(mensajesTable.creado_en));

    // Agrega datos del remitente y destinatario
    const mensajesConUsuarios = await Promise.all(
      mensajes.map(async (m) => {
        const [remitente] = await db
          .select({ id: perfilesTable.id, nombre: perfilesTable.nombre, usuario: perfilesTable.usuario, rol: perfilesTable.rol })
          .from(perfilesTable)
          .where(eq(perfilesTable.id, m.id_remitente));
        const [destinatario] = await db
          .select({ id: perfilesTable.id, nombre: perfilesTable.nombre, usuario: perfilesTable.usuario, rol: perfilesTable.rol })
          .from(perfilesTable)
          .where(eq(perfilesTable.id, m.id_destinatario));
        return {
          ...m,
          remitente: remitente || null,
          destinatario: destinatario || null,
          es_mio: m.id_remitente === userId,
        };
      })
    );

    res.json(mensajesConUsuarios);
  } catch (err) {
    req.log.error({ err }, "Error al obtener mensajes");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// POST /messages - Enviar un mensaje a un destinatario especifico
router.post("/messages", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id_destinatario, contenido } = req.body;

    if (!id_destinatario || !contenido?.trim()) {
      res.status(400).json({ error: "validation_error", message: "Destinatario y contenido son requeridos" });
      return;
    }

    if (Number(id_destinatario) === req.user!.id) {
      res.status(400).json({ error: "validation_error", message: "No puedes enviarte un mensaje a ti mismo" });
      return;
    }

    // Verifica que el destinatario existe
    const [dest] = await db
      .select({ id: perfilesTable.id, nombre: perfilesTable.nombre })
      .from(perfilesTable)
      .where(eq(perfilesTable.id, Number(id_destinatario)));

    if (!dest) {
      res.status(404).json({ error: "not_found", message: "Destinatario no encontrado" });
      return;
    }

    const [nuevoMensaje] = await db
      .insert(mensajesTable)
      .values({
        id_remitente: req.user!.id,
        id_destinatario: Number(id_destinatario),
        contenido: contenido.trim(),
        leido: false,
      })
      .returning();

    res.status(201).json({ ...nuevoMensaje, destinatario_nombre: dest.nombre });
  } catch (err) {
    req.log.error({ err }, "Error al enviar mensaje");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// PUT /messages/:id/read - Marcar un mensaje como leido
router.put("/messages/:id/read", requireAuth, async (req: AuthRequest, res) => {
  try {
    const msgId = Number(req.params.id);
    const userId = req.user!.id;

    const [msg] = await db
      .select()
      .from(mensajesTable)
      .where(and(eq(mensajesTable.id, msgId), eq(mensajesTable.id_destinatario, userId)));

    if (!msg) {
      res.status(404).json({ error: "not_found", message: "Mensaje no encontrado" });
      return;
    }

    await db.update(mensajesTable).set({ leido: true }).where(eq(mensajesTable.id, msgId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Error al marcar mensaje");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// GET /messages/unread-count - Cantidad de mensajes no leidos
router.get("/messages/unread-count", requireAuth, async (req: AuthRequest, res) => {
  try {
    const mensajes = await db
      .select()
      .from(mensajesTable)
      .where(and(eq(mensajesTable.id_destinatario, req.user!.id), eq(mensajesTable.leido, false)));

    res.json({ count: mensajes.length });
  } catch (err) {
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

// GET /users - Listar usuarios disponibles para enviar mensaje (excluyendo el actual)
// Docentes ven estudiantes; estudiantes ven docentes y otros estudiantes
router.get("/users", requireAuth, async (req: AuthRequest, res) => {
  try {
    const usuarios = await db
      .select({
        id: perfilesTable.id,
        nombre: perfilesTable.nombre,
        usuario: perfilesTable.usuario,
        rol: perfilesTable.rol,
        grado_bachillerato: perfilesTable.grado_bachillerato,
      })
      .from(perfilesTable)
      .orderBy(perfilesTable.rol, perfilesTable.nombre);

    // Excluye al usuario actual
    const filtrados = usuarios.filter((u) => u.id !== req.user!.id);
    res.json(filtrados);
  } catch (err) {
    req.log.error({ err }, "Error al obtener usuarios");
    res.status(500).json({ error: "server_error", message: "Error interno" });
  }
});

export default router;
