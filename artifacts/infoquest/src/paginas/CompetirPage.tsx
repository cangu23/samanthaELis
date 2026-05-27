// Pagina de sesion de competencia: el estudiante entra con el link del docente y compite
import { useEffect, useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/contextos/AuthContext";
import { Button } from "@/componentes/interfaz/button";
import { Progress } from "@/componentes/interfaz/progress";
import { RobotMascot } from "@/componentes/mascota/RobotMascot";
import {
  Trophy, Zap, Users, Clock, CheckCircle2, XCircle, ArrowLeft,
  Play, RefreshCw, Medal, Star, BookOpen, Copy, Check,
} from "lucide-react";
import { cn } from "@/utilidades/utils";

interface SesionInfo {
  id: number;
  codigo: string;
  nombre: string;
  activa: boolean;
  docente_nombre: string;
  participantes_count: number;
  reto: {
    id: number;
    nombre: string;
    descripcion: string;
    tipo_juego: string;
    puntos_maximos: number;
    numero_preguntas: number;
    tiempo_limite: number;
  } | null;
}

interface Participante {
  posicion: number;
  usuario_id: number;
  nombre: string;
  usuario: string;
  grado_bachillerato: number | null;
  puntuacion: number;
  tiempo_total: number;
  respuestas_correctas: number;
  total_preguntas: number;
  completado: boolean;
}

function getTier(pos: number) {
  if (pos === 1) return { color: "#F59E0B", label: "Oro" };
  if (pos === 2) return { color: "#9CA3AF", label: "Plata" };
  if (pos === 3) return { color: "#CD7F32", label: "Bronce" };
  if (pos <= 10) return { color: "#0EA5E9", label: "Elite" };
  return { color: "#22C55E", label: "Participante" };
}

function PosIcon({ pos }: { pos: number }) {
  if (pos === 1) return <Trophy className="w-4 h-4 text-yellow-400" />;
  if (pos === 2) return <Medal className="w-4 h-4 text-gray-400" />;
  if (pos === 3) return <Medal className="w-4 h-4 text-orange-500" />;
  return <span className="font-orbitron text-xs font-bold text-muted-foreground w-4 text-center">{pos}</span>;
}

function formatTime(secs: number) {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function CompetirPage() {
  const params = useParams<{ code: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const token = localStorage.getItem("cerebrito_token");
  const headers = { Authorization: `Bearer ${token}` };
  const code = (params.code ?? "").toUpperCase();

  const [sesion, setSesion] = useState<SesionInfo | null>(null);
  const [ranking, setRanking] = useState<Participante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const miResultado = ranking.find((p) => p.usuario_id === user?.id);

  const cargarRanking = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const r = await fetch(`/api/sessions/${code}/ranking`, { headers });
      if (r.ok) setRanking(await r.json());
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, [code]);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/sessions/${code}`, { headers }).then((r) => r.json()),
      fetch(`/api/sessions/${code}/ranking`, { headers }).then((r) => r.json()),
    ])
      .then(([sesData, rankData]) => {
        if (sesData.error) { setError("Sesión no encontrada. Verifica el link."); return; }
        setSesion(sesData);
        setRanking(Array.isArray(rankData) ? rankData : []);
      })
      .catch(() => setError("No se pudo cargar la sesión."))
      .finally(() => setLoading(false));
  }, [code]);

  // Polling cada 8 segundos para actualizar el ranking en vivo
  useEffect(() => {
    if (!code || loading) return;
    const interval = setInterval(() => cargarRanking(true), 8000);
    return () => clearInterval(interval);
  }, [code, loading, cargarRanking]);

  const copiarLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopiado(true);
    setTimeout(() => setLinkCopiado(false), 2000);
  };

  const tipoLabel: Record<string, string> = {
    quiz: "Quiz",
    speed_race: "Carrera de Velocidad",
    code_challenge: "Código",
    security_puzzle: "Puzzle de Seguridad",
    word_search: "Sopa de Letras",
    crossword: "Crucigrama",
    drag_drop: "Arrastrar y Soltar",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Cargando sesión de competencia...</p>
        </div>
      </div>
    );
  }

  if (error || !sesion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8 text-center max-w-sm">
          <RobotMascot size="md" mood="wrong" className="mx-auto mb-4" />
          <h2 className="text-xl font-bold font-orbitron text-red-400 mb-2">Sesión no encontrada</h2>
          <p className="text-muted-foreground text-sm">{error || "El link no es válido o la sesión ya no existe."}</p>
          <Button onClick={() => navigate("/dashboard")} className="mt-6 w-full" variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ir al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const reto = sesion.reto;

  return (
    <div className="min-h-screen bg-background">
      {/* Header compacto */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#A855F7]/20 border border-[#A855F7]/40 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-4 h-4 text-[#A855F7]" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold font-orbitron text-white truncate text-sm sm:text-base">{sesion.nombre}</h1>
              <p className="text-xs text-muted-foreground">Por {sesion.docente_nombre} · Código: <span className="font-mono text-[#A855F7]">{code}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={cn(
              "text-xs px-2 py-1 rounded-full font-medium",
              sesion.activa
                ? "bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            )}>
              {sesion.activa ? "● Activa" : "● Cerrada"}
            </span>
            <button
              onClick={copiarLink}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
              title="Copiar link"
            >
              {linkCopiado ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Info del reto + boton de competir */}
        {reto && (
          <div className="glass-card rounded-2xl p-5 border border-[#A855F7]/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-[#A855F7]" />
                  <span className="text-xs text-[#A855F7] font-medium uppercase tracking-wide">
                    {tipoLabel[reto.tipo_juego] || reto.tipo_juego}
                  </span>
                </div>
                <h2 className="font-bold text-white text-lg">{reto.nombre}</h2>
                {reto.descripcion && (
                  <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{reto.descripcion}</p>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Zap className="w-3 h-3" />{reto.numero_preguntas} preguntas
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />{formatTime(reto.tiempo_limite)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="w-3 h-3" />{reto.puntos_maximos} pts
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:items-end w-full sm:w-auto">
                {miResultado ? (
                  <div className="text-center p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 w-full sm:w-36">
                    <CheckCircle2 className="w-5 h-5 text-[#22C55E] mx-auto mb-1" />
                    <div className="text-lg font-bold font-orbitron text-[#22C55E]">{miResultado.puntuacion}</div>
                    <div className="text-xs text-muted-foreground">Tu puntaje</div>
                    <div className="text-xs text-[#22C55E] mt-0.5">Posición #{miResultado.posicion}</div>
                  </div>
                ) : sesion.activa ? (
                  <Button
                    onClick={() => navigate(`/challenge/${reto.id}?sesion=${code}`)}
                    className="w-full sm:w-auto gap-2 bg-[#A855F7] hover:bg-[#A855F7]/80 font-bold px-6"
                    size="lg"
                  >
                    <Play className="w-5 h-5" />
                    ¡Competir!
                  </Button>
                ) : (
                  <div className="text-xs text-muted-foreground text-center p-3 rounded-xl border border-white/10 w-full sm:w-36">
                    Sesión cerrada
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Ranking en vivo */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              Ranking de la Sesión
              <span className="text-xs text-muted-foreground font-normal ml-1">
                <Users className="w-3 h-3 inline mr-0.5" />{ranking.length} participante{ranking.length !== 1 ? "s" : ""}
              </span>
            </h2>
            <button
              onClick={() => cargarRanking()}
              disabled={refreshing}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors"
            >
              <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
              Actualizar
            </button>
          </div>

          {ranking.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-white/10">
              <Trophy className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">Nadie ha completado el reto todavía.</p>
              {sesion.activa && (
                <p className="text-muted-foreground/60 text-xs mt-1">¡Sé el primero en competir!</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {ranking.map((p) => {
                const tier = getTier(p.posicion);
                const esYo = p.usuario_id === user?.id;
                const precision = p.total_preguntas > 0
                  ? Math.round((p.respuestas_correctas / p.total_preguntas) * 100)
                  : 0;
                return (
                  <div
                    key={p.usuario_id}
                    className={cn(
                      "glass-card rounded-xl p-4 border transition-all",
                      esYo
                        ? "border-[#A855F7]/50 bg-[#A855F7]/5 ring-1 ring-[#A855F7]/20"
                        : p.posicion <= 3
                          ? "border-white/10"
                          : "border-white/5 opacity-90"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Posición */}
                      <div className="w-8 flex-shrink-0 flex items-center justify-center">
                        <PosIcon pos={p.posicion} />
                      </div>

                      {/* Avatar con inicial */}
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: `${tier.color}30`, border: `1.5px solid ${tier.color}60` }}
                      >
                        {p.nombre.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white truncate">
                            {p.nombre}
                            {esYo && <span className="ml-1.5 text-xs text-[#A855F7]">(tú)</span>}
                          </span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: `${tier.color}20`, color: tier.color }}
                          >
                            {tier.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CheckCircle2 className="w-3 h-3 text-[#22C55E]" />{p.respuestas_correctas}/{p.total_preguntas}
                          </span>
                          <span className="text-xs text-muted-foreground">{precision}% precisión</span>
                          {p.tiempo_total > 0 && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />{formatTime(p.tiempo_total)}
                            </span>
                          )}
                        </div>
                        {p.total_preguntas > 0 && (
                          <Progress value={precision} className="h-1 mt-1.5" />
                        )}
                      </div>

                      {/* Puntuación */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-xl font-bold font-orbitron" style={{ color: tier.color }}>
                          {p.puntuacion}
                        </div>
                        <div className="text-xs text-muted-foreground">pts</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground/50">
          <span>Se actualiza automáticamente cada 8 segundos</span>
          <button
            onClick={() => navigate("/dashboard")}
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
