// Bandeja de entrada: mensajes directos, alertas y recomendaciones
// Docentes y estudiantes pueden elegir a quien enviar mensajes
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Bell, MessageSquare, Lightbulb, Send, Users, CheckCircle2,
  AlertCircle, ChevronDown, ChevronUp, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type Tab = "mensajes" | "alertas" | "recomendaciones";

interface Mensaje {
  id: number;
  contenido: string;
  leido: boolean;
  creado_en: string;
  es_mio: boolean;
  remitente: { id: number; nombre: string; rol: string } | null;
  destinatario: { id: number; nombre: string; rol: string } | null;
}
interface Usuario { id: number; nombre: string; usuario: string; rol: string; }
interface Alerta { id: number; titulo: string; mensaje: string; tipo: string; leido: boolean; fecha_creacion: string; }
interface Recomendacion { id: number; titulo: string; descripcion: string; tipo: string; leido: boolean; fecha_creacion: string; }

function tiempo(fecha: string) {
  try {
    return formatDistanceToNow(new Date(fecha), { addSuffix: true, locale: es });
  } catch { return ""; }
}

export function InboxPage() {
  useAuth(); // solo para proteger la ruta
  const token = localStorage.getItem("cerebrito_token");
  const [tab, setTab] = useState<Tab>("mensajes");

  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [recs, setRecs] = useState<Recomendacion[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [destId, setDestId] = useState<number | "">("");
  const [texto, setTexto] = useState("");
  const [sending, setSending] = useState(false);
  const [expandedAlert, setExpandedAlert] = useState<number | null>(null);

  const headers = { Authorization: `Bearer ${token}` };

  async function cargarTodo() {
    setLoading(true);
    try {
      const [mRes, aRes, rRes, uRes] = await Promise.all([
        fetch("/api/messages", { headers }),
        fetch("/api/inbox/alerts", { headers }),
        fetch("/api/inbox/recommendations", { headers }),
        fetch("/api/users", { headers }),
      ]);
      if (mRes.ok) setMensajes(await mRes.json());
      if (aRes.ok) setAlertas(await aRes.json());
      if (rRes.ok) setRecs(await rRes.json());
      if (uRes.ok) setUsuarios(await uRes.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargarTodo(); }, []);

  async function enviarMensaje() {
    if (!destId || !texto.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ id_destinatario: destId, contenido: texto.trim() }),
      });
      if (res.ok) {
        setTexto(""); setDestId(""); setComposing(false);
        cargarTodo();
      }
    } finally { setSending(false); }
  }

  async function marcarAlertaLeida(id: number) {
    await fetch(`/api/inbox/alerts/${id}/read`, { method: "PUT", headers });
    setAlertas((prev) => prev.map((a) => a.id === id ? { ...a, leido: true } : a));
  }

  async function marcarMensajeLeido(id: number) {
    await fetch(`/api/messages/${id}/read`, { method: "PUT", headers });
    setMensajes((prev) => prev.map((m) => m.id === id ? { ...m, leido: true } : m));
  }

  const noLeidosMensajes = mensajes.filter((m) => !m.leido && !m.es_mio).length;
  const noLeidosAlertas = alertas.filter((a) => !a.leido).length;

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "mensajes", label: "Mensajes", icon: MessageSquare, badge: noLeidosMensajes },
    { id: "alertas", label: "Alertas", icon: Bell, badge: noLeidosAlertas },
    { id: "recomendaciones", label: "Recomendaciones", icon: Lightbulb },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-orbitron text-white">Bandeja</h1>
          <p className="text-muted-foreground text-sm">Mensajes, alertas y recomendaciones</p>
        </div>
        {tab === "mensajes" && (
          <Button
            size="sm"
            onClick={() => { setComposing(true); }}
            className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/80 gap-2"
          >
            <Send className="w-4 h-4" />
            Nuevo Mensaje
          </Button>
        )}
      </div>

      {/* Compositor de mensaje */}
      <AnimatePresence>
        {composing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card rounded-xl p-5 border border-[#0EA5E9]/30 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0EA5E9]" />
                Nuevo Mensaje
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setComposing(false)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>

            {/* Selector de destinatario */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Para:</label>
              <select
                value={destId}
                onChange={(e) => setDestId(Number(e.target.value) || "")}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#0EA5E9]"
              >
                <option value="">— Seleccionar destinatario —</option>
                {usuarios
                  .sort((a, b) => a.rol === "docente" ? -1 : b.rol === "docente" ? 1 : 0)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} ({u.rol === "docente" ? "Docente" : `Estudiante`}) — @{u.usuario}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Mensaje:</label>
              <Textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                rows={4}
                className="bg-background border-border text-white resize-none"
              />
            </div>

            <Button
              onClick={enviarMensaje}
              disabled={!destId || !texto.trim() || sending}
              className="w-full bg-[#0EA5E9] hover:bg-[#0EA5E9]/80 gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? "Enviando..." : "Enviar Mensaje"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all",
              tab === t.id
                ? "bg-[#0EA5E9] text-white shadow-lg"
                : "glass-card text-muted-foreground hover:text-white"
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.badge ? (
              <Badge className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0 h-5 min-w-5">{t.badge}</Badge>
            ) : null}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando...</div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

            {/* MENSAJES */}
            {tab === "mensajes" && (
              <div className="space-y-3">
                {mensajes.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No hay mensajes aún</p>
                    <p className="text-xs mt-1">Presiona "Nuevo Mensaje" para escribir a alguien</p>
                  </div>
                )}
                {mensajes.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "glass-card rounded-xl p-4 border cursor-pointer transition-all",
                      !m.leido && !m.es_mio
                        ? "border-[#0EA5E9]/40 bg-[#0EA5E9]/5"
                        : "border-white/5"
                    )}
                    onClick={() => !m.es_mio && !m.leido && marcarMensajeLeido(m.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0",
                        m.es_mio ? "bg-[#A855F7]" : "bg-[#0EA5E9]"
                      )}>
                        {m.es_mio
                          ? (m.destinatario?.nombre?.charAt(0) || "?")
                          : (m.remitente?.nombre?.charAt(0) || "?")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">
                              {m.es_mio
                                ? `→ ${m.destinatario?.nombre || "Desconocido"}`
                                : m.remitente?.nombre || "Desconocido"}
                            </span>
                            <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 border-white/20 text-muted-foreground">
                              {m.es_mio ? "Enviado" : "Recibido"}
                            </Badge>
                            {!m.leido && !m.es_mio && (
                              <Badge className="text-xs px-1.5 py-0 h-4 bg-[#0EA5E9] text-white">Nuevo</Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{tiempo(m.creado_en)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{m.contenido}</p>
                        {m.remitente && (
                          <p className="text-xs text-muted-foreground/50 mt-1">
                            {m.es_mio ? `Para: @${m.destinatario?.nombre}` : `De: ${m.remitente.rol === "docente" ? "Docente" : "Estudiante"} @${m.remitente.nombre}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* ALERTAS */}
            {tab === "alertas" && (
              <div className="space-y-3">
                {alertas.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Sin alertas por ahora</p>
                  </div>
                )}
                {alertas.map((a) => {
                  const iconColor =
                    a.tipo === "logro" ? "#22C55E" :
                    a.tipo === "bajo_rendimiento" ? "#EF4444" :
                    a.tipo === "nivel_completado" ? "#A855F7" : "#0EA5E9";
                  const expanded = expandedAlert === a.id;
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "glass-card rounded-xl p-4 border cursor-pointer",
                        !a.leido ? "border-[#0EA5E9]/30" : "border-white/5 opacity-70"
                      )}
                      onClick={() => {
                        setExpandedAlert(expanded ? null : a.id);
                        if (!a.leido) marcarAlertaLeida(a.id);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: iconColor }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-white">{a.titulo}</p>
                            <div className="flex items-center gap-2">
                              {!a.leido && <div className="w-2 h-2 rounded-full bg-[#0EA5E9]" />}
                              {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                            </div>
                          </div>
                          {!expanded && <p className="text-xs text-muted-foreground truncate">{a.mensaje}</p>}
                        </div>
                      </div>
                      <AnimatePresence>
                        {expanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="mt-3 pt-3 border-t border-white/10">
                              <p className="text-sm text-muted-foreground">{a.mensaje}</p>
                              <p className="text-xs text-muted-foreground/50 mt-2">{tiempo(a.fecha_creacion)}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* RECOMENDACIONES */}
            {tab === "recomendaciones" && (
              <div className="space-y-3">
                {recs.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Sin recomendaciones aún</p>
                    <p className="text-xs mt-1">Completa retos para recibir sugerencias personalizadas</p>
                  </div>
                )}
                {recs.map((r) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card rounded-xl p-4 border border-[#22C55E]/20"
                  >
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-[#22C55E] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-white">{r.titulo}</p>
                        <p className="text-sm text-muted-foreground mt-1">{r.descripcion}</p>
                        <p className="text-xs text-muted-foreground/50 mt-2">{tiempo(r.fecha_creacion)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
