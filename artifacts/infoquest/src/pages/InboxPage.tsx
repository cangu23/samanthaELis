// Pagina de bandeja de entrada: alertas, retroalimentacion y recomendaciones
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Bell,
  MessageSquare,
  Lightbulb,
  CheckCircle2,
  Send,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type TabType = "alertas" | "feedback" | "recomendaciones";

interface Alert {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  leido: boolean;
  fecha_creacion: string;
}

interface Feedback {
  id: number;
  mensaje: string;
  respuesta: string | null;
  leido: boolean;
  fecha_creacion: string;
  docente_nombre?: string;
}

interface Recomendacion {
  id: number;
  titulo: string;
  descripcion: string;
  tipo: string;
  leido: boolean;
  fecha_creacion: string;
}

const tipoColors: Record<string, string> = {
  alerta: "#EF4444",
  logro: "#22C55E",
  info: "#0EA5E9",
  tarea: "#A855F7",
  recurso: "#0EA5E9",
  practica: "#22C55E",
  desafio: "#F59E0B",
};

export function InboxPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabType>("alertas");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const token = localStorage.getItem("infoquest_token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [alertRes, feedRes, recRes] = await Promise.all([
        fetch("/api/inbox/alerts", { headers }).then((r) => r.json()),
        fetch("/api/inbox/feedback", { headers }).then((r) => r.json()),
        fetch("/api/inbox/recommendations", { headers }).then((r) => r.json()),
      ]);
      setAlerts(Array.isArray(alertRes) ? alertRes : alertRes.alerts || []);
      setFeedback(Array.isArray(feedRes) ? feedRes : feedRes.feedback || []);
      setRecomendaciones(Array.isArray(recRes) ? recRes : recRes.recommendations || []);
    } catch (err) {
      console.error("Error cargando bandeja:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAlertRead = async (id: number) => {
    await fetch(`/api/inbox/alerts/${id}/read`, { method: "POST", headers }).catch(console.error);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, leido: true } : a)));
  };

  const sendFeedback = async () => {
    if (!feedbackMsg.trim()) return;
    setSendingFeedback(true);
    try {
      await fetch("/api/inbox/feedback", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje: feedbackMsg }),
      });
      setFeedbackMsg("");
      await loadAll();
    } catch (err) {
      console.error("Error enviando feedback:", err);
    } finally {
      setSendingFeedback(false);
    }
  };

  const unreadAlerts = alerts.filter((a) => !a.leido).length;
  const unreadFeedback = feedback.filter((f) => !f.leido).length;

  const tabs: { id: TabType; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "alertas", label: "Alertas", icon: Bell, count: unreadAlerts },
    { id: "feedback", label: "Mensajes", icon: MessageSquare, count: unreadFeedback },
    { id: "recomendaciones", label: "Recomendaciones", icon: Lightbulb },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-orbitron">Bandeja de Entrada</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Alertas, mensajes y recomendaciones personalizadas
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/50 pb-0">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 -mb-px text-sm font-medium border-b-2 transition-colors",
              tab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
            {count ? (
              <span className="px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
                {count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Contenido de alertas */}
      {tab === "alertas" && (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No tienes alertas por ahora</p>
            </div>
          ) : (
            alerts.map((alert, i) => {
              const color = tipoColors[alert.tipo] || "#0EA5E9";
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    if (!alert.leido) markAlertRead(alert.id);
                    setExpandedId(expandedId === alert.id ? null : alert.id);
                  }}
                  className={cn(
                    "p-4 rounded-xl border cursor-pointer transition-all",
                    !alert.leido
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/50 bg-card/50",
                    "hover:border-primary/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
                    >
                      <AlertCircle className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{alert.titulo}</span>
                        {!alert.leido && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      {expandedId === alert.id && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-sm text-muted-foreground mt-2"
                        >
                          {alert.mensaje}
                        </motion.p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(alert.fecha_creacion), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                      {expandedId === alert.id ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Contenido de feedback/mensajes */}
      {tab === "feedback" && (
        <div className="space-y-4">
          {/* Formulario para enviar mensaje (solo estudiantes) */}
          {user?.rol === "estudiante" && (
            <div className="p-4 rounded-xl border border-border/50 bg-card/50 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Send className="w-4 h-4 text-primary" />
                Enviar Mensaje al Docente
              </h3>
              <Textarea
                placeholder="Escribe tu pregunta o comentario..."
                value={feedbackMsg}
                onChange={(e) => setFeedbackMsg(e.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
              <Button
                size="sm"
                onClick={sendFeedback}
                disabled={sendingFeedback || !feedbackMsg.trim()}
                className="gap-2"
              >
                {sendingFeedback ? (
                  <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Enviar
              </Button>
            </div>
          )}

          {feedback.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No hay mensajes todavia</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedback.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "p-4 rounded-xl border",
                    !item.leido ? "border-secondary/30 bg-secondary/5" : "border-border/50 bg-card/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground mb-2">{item.mensaje}</div>
                      {item.respuesta && (
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                          <div className="text-xs text-primary font-semibold mb-1">
                            Respuesta del docente
                          </div>
                          {item.respuesta}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(item.fecha_creacion), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recomendaciones */}
      {tab === "recomendaciones" && (
        <div className="space-y-3">
          {recomendaciones.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No hay recomendaciones disponibles</p>
              <p className="text-xs mt-1">Completa mas retos para recibir recomendaciones personalizadas</p>
            </div>
          ) : (
            recomendaciones.map((rec, i) => {
              const color = tipoColors[rec.tipo] || "#0EA5E9";
              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-xl border border-border/50 bg-card/50"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
                    >
                      <BookOpen className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">{rec.titulo}</span>
                        <Badge
                          variant="outline"
                          className="text-xs px-1.5 py-0"
                          style={{ borderColor: `${color}40`, color }}
                        >
                          {rec.tipo}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.descripcion}</p>
                      <div className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(rec.fecha_creacion), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
