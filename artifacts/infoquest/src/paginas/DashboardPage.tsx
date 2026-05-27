// Dashboard principal: vista diferente para estudiantes y docentes
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contextos/AuthContext";
import { buttonVariants } from "@/componentes/interfaz/button";
import { cn } from "@/utilidades/utils";
import { Badge } from "@/componentes/interfaz/badge";
import { Progress } from "@/componentes/interfaz/progress";
import { RobotMascot } from "@/componentes/mascota/RobotMascot";
import {
  Trophy,
  Zap,
  BookOpen,
  Flame,
  Star,
  ChevronRight,
  Play,
  Clock,
  TrendingUp,
  Users,
  PlusCircle,
  Trash2,
  Link2,
  Swords,
  Copy,
  Check,
  ExternalLink,
  Eye,
} from "lucide-react";

// Tarjeta de estadistica del dashboard
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-bold font-orbitron" style={{ color }}>
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard para estudiantes
function StudentDashboard() {
  const { user } = useAuth();
  const [module, setModule] = useState<{
    id: number;
    nombre: string;
    anio_bachillerato: number;
    descripcion: string;
    color: string;
    icono: string;
    activo: boolean;
  } | null>(null);
  const [levels, setLevels] = useState<
    { id: number; nombre: string; orden: number; descripcion: string; puntos_por_reto: number; activo: boolean }[]
  >([]);
  const [challenges, setChallenges] = useState<
    { id: number; nombre: string; descripcion: string; tipo_juego: string; puntos_maximos: number; id_nivel: number }[]
  >([]);
  const [savedAttempts, setSavedAttempts] = useState<
    { id: number; id_reto: number; progreso_actual: number; total_preguntas: number }[]
  >([]);

  useEffect(() => {
    if (!user?.grado_bachillerato) return;
    fetch(`/api/modules?anio=${user.grado_bachillerato}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("cerebrito_token")}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const mod = Array.isArray(data) ? data[0] : data;
        if (mod?.id) {
          setModule(mod);
          fetch(`/api/modules/${mod.id}/levels`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("cerebrito_token")}` },
          })
            .then((r) => r.json())
            .then((lvls) => setLevels(Array.isArray(lvls) ? lvls : []));
          fetch(`/api/challenges?id_modulo=${mod.id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("cerebrito_token")}` },
          })
            .then((r) => r.json())
            .then((ch) => setChallenges(Array.isArray(ch) ? ch : []));
        }
      })
      .catch(console.error);

    fetch("/api/saved-attempts", {
      headers: { Authorization: `Bearer ${localStorage.getItem("cerebrito_token")}` },
    })
      .then((r) => r.json())
      .then((sa) => setSavedAttempts(Array.isArray(sa) ? sa : []))
      .catch(console.error);
  }, [user?.grado_bachillerato]);

  const tipoLabels: Record<string, string> = {
    quiz: "Quiz",
    code_challenge: "Desafio Codigo",
    security_puzzle: "Puzzle Seguridad",
    drag_drop: "Arrastra y Suelta",
    speed_race: "Carrera Rapida",
  };

  const tipoColors: Record<string, string> = {
    quiz: "#0EA5E9",
    code_challenge: "#A855F7",
    security_puzzle: "#22C55E",
    drag_drop: "#F59E0B",
    speed_race: "#EF4444",
  };

  if (!user) return null;

  return (
    <div className="space-y-6 page-enter">
      {/* Bienvenida */}
      <div className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/5 border border-primary/20">
        <RobotMascot size="sm" mood="happy" />
        <div className="flex-1">
          <h1 className="text-xl font-bold">
            ¡Hola, <span className="text-primary">{user.nombre.split(" ")[0]}</span>!
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {user.grado_bachillerato}° de Bachillerato — {module?.nombre || "Cargando modulo..."}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium">
              Racha de <span className="text-orange-400 font-bold">{user.racha_dias}</span> dias
            </span>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-2xl font-bold font-orbitron text-primary">
            {user.puntos_totales.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">puntos totales</div>
        </div>
      </div>

      {/* Estadisticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Trophy} label="Puntos" value={user.puntos_totales} color="#0EA5E9" />
        <StatCard icon={Zap} label="Retos" value={user.retos_completados} color="#22C55E" />
        <StatCard icon={Flame} label="Racha" value={`${user.racha_dias}d`} color="#F59E0B" />
        <StatCard icon={Star} label="Grado" value={`${user.grado_bachillerato}°`} color="#A855F7" />
      </div>

      {/* Intentos guardados (retos pendientes) */}
      {savedAttempts.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            Retos Pendientes
          </h2>
          <div className="space-y-2">
            {savedAttempts.map((attempt) => {
              const challenge = challenges.find((c) => c.id === attempt.id_reto);
              const progress = Math.round(
                (attempt.progreso_actual / attempt.total_preguntas) * 100
              );
              return (
                <div
                  key={attempt.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-card/60 border border-yellow-400/20"
                >
                  <Clock className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {challenge?.nombre || "Reto guardado"}
                    </div>
                    <Progress value={progress} className="mt-1 h-1.5" />
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {attempt.progreso_actual}/{attempt.total_preguntas} preguntas completadas
                    </div>
                  </div>
                  <Link
                    href={`/challenge/${attempt.id_reto}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-shrink-0")}
                  >
                    Continuar
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Retos disponibles */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Retos Disponibles
          </h2>
          <Link
            href="/modules"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-xs gap-1")}
          >
            Ver todo <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {challenges.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            Cargando retos disponibles...
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {challenges.slice(0, 4).map((challenge) => {
              const color = tipoColors[challenge.tipo_juego] || "#0EA5E9";
              return (
                <div
                  key={challenge.id}
                  className="p-4 rounded-xl bg-card/60 border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
                    >
                      <Zap className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{challenge.nombre}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {challenge.descripcion}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="outline"
                          className="text-xs px-1.5 py-0"
                          style={{ borderColor: `${color}40`, color }}
                        >
                          {tipoLabels[challenge.tipo_juego] || challenge.tipo_juego}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-yellow-400" />
                          {challenge.puntos_maximos} pts
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/challenge/${challenge.id}`}
                    className={cn(buttonVariants({ size: "sm" }), "w-full mt-3 gap-2 h-8 text-xs")}
                  >
                    <Play className="w-3 h-3" />
                    Iniciar Reto
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Niveles del modulo */}
      {levels.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-secondary" />
            Tu Progreso
          </h2>
          <div className="space-y-2">
            {levels.map((level) => (
              <div
                key={level.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/40"
              >
                <div className="w-7 h-7 rounded-full bg-secondary/15 border border-secondary/30 flex items-center justify-center text-xs font-bold text-secondary">
                  {level.orden}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{level.nombre}</div>
                  <div className="text-xs text-muted-foreground">{level.descripcion}</div>
                </div>
                <div className="text-xs text-muted-foreground">{level.puntos_por_reto} pts</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface RetoPersonalizado {
  id: number;
  nombre: string;
  tipo_juego: string;
  puntos_maximos: number;
  numero_preguntas: number;
  tiempo_limite: number;
  id_docente: number;
  modulo: { nombre: string } | null;
  nivel: { nombre: string } | null;
}

// Dashboard para docentes
function TeacherDashboard() {
  const { user } = useAuth();
  const token = localStorage.getItem("cerebrito_token");
  const headers = { Authorization: `Bearer ${token}` };
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalChallenges: 0,
    totalResults: 0,
    avgScore: 0,
  });
  const [misRetos, setMisRetos] = useState<RetoPersonalizado[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [copiado, setCopiado] = useState<number | null>(null);

  // Sesiones de competencia
  interface SesionItem { id: number; codigo: string; nombre: string; activa: boolean; reto_nombre: string; reto_tipo: string; id_reto: number; participantes_count: number; creado_en: string; }
  const [misSesiones, setMisSesiones] = useState<SesionItem[]>([]);
  const [mostrarFormSesion, setMostrarFormSesion] = useState(false);
  const [nuevoNombreSesion, setNuevoNombreSesion] = useState("");
  const [nuevoRetoSesion, setNuevoRetoSesion] = useState("");
  const [creandoSesion, setCreandoSesion] = useState(false);
  const [codigoCopiado, setCodigoCopiado] = useState<string | null>(null);
  const [todosRetos, setTodosRetos] = useState<{ id: number; nombre: string; tipo_juego: string }[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/ranking", { headers }).then((r) => r.json()),
      fetch("/api/challenges", { headers }).then((r) => r.json()),
      fetch("/api/challenges/custom", { headers }).then((r) => r.json()),
      fetch("/api/sessions", { headers }).then((r) => r.json()),
    ])
      .then(([ranking, challenges, custom, sesiones]) => {
        const rankData = Array.isArray(ranking) ? ranking : ranking.ranking || [];
        const challData = Array.isArray(challenges) ? challenges : [];
        setStats({
          totalStudents: rankData.length,
          totalChallenges: challData.length,
          totalResults: rankData.reduce((s: number, u: { retos_completados?: number }) => s + (u.retos_completados || 0), 0),
          avgScore: rankData.length
            ? Math.round(
                rankData.reduce((s: number, u: { puntos_totales?: number }) => s + (u.puntos_totales || 0), 0) /
                  rankData.length
              )
            : 0,
        });
        const propios = Array.isArray(custom)
          ? custom.filter((r: RetoPersonalizado & { docente?: { id: number } }) => r.id_docente === user?.id || r.docente?.id === user?.id)
          : [];
        setMisRetos(propios);
        setTodosRetos(challData.map((c: { id: number; nombre: string; tipo_juego: string }) => ({ id: c.id, nombre: c.nombre, tipo_juego: c.tipo_juego })));
        setMisSesiones(Array.isArray(sesiones) ? sesiones : []);
      })
      .catch(console.error);
  }, []);

  const crearSesion = async () => {
    if (!nuevoNombreSesion.trim() || !nuevoRetoSesion) return;
    setCreandoSesion(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nuevoNombreSesion.trim(), id_reto: Number(nuevoRetoSesion) }),
      });
      if (res.ok) {
        const nueva = await res.json();
        setMisSesiones((prev) => [nueva, ...prev]);
        setNuevoNombreSesion("");
        setNuevoRetoSesion("");
        setMostrarFormSesion(false);
      }
    } finally {
      setCreandoSesion(false);
    }
  };

  const copiarLinkSesion = (codigo: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/competir/${codigo}`);
    setCodigoCopiado(codigo);
    setTimeout(() => setCodigoCopiado(null), 2000);
  };

  const eliminarReto = async (id: number) => {
    setDeletingId(id);
    try {
      await fetch(`/api/challenges/custom/${id}`, { method: "DELETE", headers });
      setMisRetos((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // silenciar error
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const copiarLink = (id: number) => {
    navigator.clipboard.writeText(`${window.location.origin}/challenge/-${id}`);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 2000);
  };

  if (!user) return null;

  return (
    <div className="space-y-6 page-enter">
      {/* Bienvenida docente */}
      <div className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-secondary/10 to-accent/5 border border-secondary/20">
        <div className="w-14 h-14 rounded-2xl bg-secondary/20 border border-secondary/40 flex items-center justify-center">
          <Users className="w-7 h-7 text-secondary" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">
            Panel Docente —{" "}
            <span className="text-secondary">{user.nombre}</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Gestiona retos, revisa el desempeno y da retroalimentacion a tus estudiantes
          </p>
        </div>
      </div>

      {/* Estadisticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Estudiantes" value={stats.totalStudents} color="#A855F7" />
        <StatCard icon={Zap} label="Retos" value={stats.totalChallenges} color="#0EA5E9" />
        <StatCard icon={TrendingUp} label="Resultados" value={stats.totalResults} color="#22C55E" />
        <StatCard icon={Star} label="Prom. Puntos" value={stats.avgScore} color="#F59E0B" />
      </div>

      {/* Acciones rapidas docente */}
      <div>
        <h2 className="text-base font-semibold mb-3">Acciones Rapidas</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            {
              href: "/challenges/create",
              icon: PlusCircle,
              label: "Crear Reto Personalizado",
              desc: "Diseña un reto con tus propias preguntas",
              color: "#0EA5E9",
            },
            {
              href: "/ranking",
              icon: Trophy,
              label: "Ver Ranking Completo",
              desc: "Revisa el desempeno de todos los estudiantes",
              color: "#22C55E",
            },
            {
              href: "/inbox",
              icon: Zap,
              label: "Dar Retroalimentacion",
              desc: "Responde a estudiantes y envia alertas",
              color: "#A855F7",
            },
          ].map(({ href, icon: Icon, label, desc, color }) => (
            <Link key={href} href={href}>
              <div className="p-4 rounded-xl bg-card/60 border border-border/50 hover:border-primary/30 hover:scale-[1.02] transition-all cursor-pointer">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="text-sm font-semibold">{label}</div>
                <div className="text-xs text-muted-foreground mt-1">{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Mis Retos Personalizados */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            Mis Retos Personalizados
          </h2>
          <Link
            href="/challenges/create"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs gap-1 border-purple-500/30 text-purple-400 hover:bg-purple-500/10")}
          >
            <PlusCircle className="w-3 h-3" />
            Crear nuevo
          </Link>
        </div>

        {misRetos.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-dashed border-border/50 text-muted-foreground text-sm">
            <Zap className="w-8 h-8 mx-auto mb-2 opacity-20" />
            Aún no has creado ningún reto personalizado.
          </div>
        ) : (
          <div className="space-y-2">
            {misRetos.map((reto) => {
              const isConfirming = confirmDelete === reto.id;
              const isDeleting = deletingId === reto.id;
              const linkCopiado = copiado === reto.id;
              return (
                <div
                  key={reto.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card/60 border border-purple-500/20 hover:border-purple-500/40 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{reto.nombre}</div>
                    <div className="text-xs text-muted-foreground">
                      {reto.tipo_juego.replace(/_/g, " ")} · {reto.numero_preguntas} preguntas · {reto.puntos_maximos} pts
                      {reto.modulo && ` · ${reto.modulo.nombre}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => copiarLink(reto.id)}
                      title="Copiar link del reto"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                    >
                      {linkCopiado ? (
                        <span className="text-[10px] text-blue-400 font-bold">✓ Copiado</span>
                      ) : (
                        <Link2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isConfirming ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => eliminarReto(reto.id)}
                          disabled={isDeleting}
                          className="text-[10px] font-bold px-2 py-1 rounded-md bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                        >
                          {isDeleting ? "..." : "Sí, eliminar"}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-[10px] px-2 py-1 rounded-md bg-muted/30 text-muted-foreground border border-border/40 hover:bg-muted/50 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(reto.id)}
                        title="Eliminar reto"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sesiones de Competencia */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Swords className="w-4 h-4 text-[#A855F7]" />
            Sesiones de Competencia
          </h2>
          <button
            onClick={() => setMostrarFormSesion(!mostrarFormSesion)}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-[#A855F7]/30 text-[#A855F7] hover:bg-[#A855F7]/10 transition-all font-medium"
          >
            <PlusCircle className="w-3 h-3" />
            Nueva sesión
          </button>
        </div>

        {/* Formulario de creacion */}
        {mostrarFormSesion && (
          <div className="glass-card rounded-xl p-4 border border-[#A855F7]/30 space-y-3 mb-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nombre de la sesión:</label>
              <input
                value={nuevoNombreSesion}
                onChange={(e) => setNuevoNombreSesion(e.target.value)}
                placeholder="Ej: Competencia 1er Parcial"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#A855F7] placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Reto a competir:</label>
              <select
                value={nuevoRetoSesion}
                onChange={(e) => setNuevoRetoSesion(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#A855F7]"
              >
                <option value="">— Seleccionar reto —</option>
                {todosRetos.map((r) => (
                  <option key={r.id} value={r.id}>{r.nombre} ({r.tipo_juego.replace(/_/g, " ")})</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={crearSesion}
                disabled={creandoSesion || !nuevoNombreSesion.trim() || !nuevoRetoSesion}
                className="flex-1 py-2 rounded-lg text-sm font-semibold bg-[#A855F7] text-white hover:bg-[#A855F7]/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {creandoSesion ? "Creando..." : "Crear y obtener link"}
              </button>
              <button
                onClick={() => setMostrarFormSesion(false)}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground border border-border/50 hover:bg-muted/30 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Lista de sesiones */}
        {misSesiones.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-dashed border-border/50 text-muted-foreground text-sm">
            <Swords className="w-8 h-8 mx-auto mb-2 opacity-20" />
            Aún no has creado sesiones de competencia.
          </div>
        ) : (
          <div className="space-y-2">
            {misSesiones.map((s) => {
              const linkCop = codigoCopiado === s.codigo;
              return (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-card/60 border border-[#A855F7]/20 hover:border-[#A855F7]/40 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-[#A855F7]/15 border border-[#A855F7]/30 flex items-center justify-center flex-shrink-0">
                    <Swords className="w-4 h-4 text-[#A855F7]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate">{s.nombre}</span>
                      <span className={cn("text-xs px-1.5 py-0.5 rounded-full flex-shrink-0", s.activa ? "bg-[#22C55E]/20 text-[#22C55E]" : "bg-red-500/20 text-red-400")}>
                        {s.activa ? "Activa" : "Cerrada"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.reto_nombre} · <span className="font-mono text-[#A855F7]">{s.codigo}</span> · {s.participantes_count} participante{s.participantes_count !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => copiarLinkSesion(s.codigo)}
                      title="Copiar link para compartir"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-[#A855F7] hover:bg-[#A855F7]/10 transition-colors"
                    >
                      {linkCop ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <Link href={`/competir/${s.codigo}`}>
                      <span className="p-1.5 rounded-lg text-muted-foreground hover:text-[#0EA5E9] hover:bg-[#0EA5E9]/10 transition-colors flex items-center" title="Ver ranking de sesión">
                        <Eye className="w-3.5 h-3.5" />
                      </span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Enlace al ranking y modulos */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Link href="/ranking">
          <div className="p-4 rounded-xl bg-card/60 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Tabla de Clasificacion</div>
              <div className="text-xs text-muted-foreground mt-0.5">Posiciones de todos los estudiantes</div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </Link>
        <Link href="/modules">
          <div className="p-4 rounded-xl bg-card/60 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Modulos y Contenidos</div>
              <div className="text-xs text-muted-foreground mt-0.5">Revisa los 3 modulos del curriculo</div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </Link>
      </div>
    </div>
  );
}

// Componente principal del dashboard
export function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  return user.rol === "docente" ? <TeacherDashboard /> : <StudentDashboard />;
}
