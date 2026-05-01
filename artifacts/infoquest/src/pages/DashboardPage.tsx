// Dashboard principal: vista diferente para estudiantes y docentes
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RobotMascot } from "@/components/mascot/RobotMascot";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

// Tarjeta de estadistica del dashboard
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card rounded-xl p-4"
    >
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
    </motion.div>
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

  // Carga el modulo del grado del estudiante
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
          // Carga niveles
          fetch(`/api/modules/${mod.id}/levels`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("cerebrito_token")}` },
          })
            .then((r) => r.json())
            .then((lvls) => setLevels(Array.isArray(lvls) ? lvls : []));
          // Carga retos
          fetch(`/api/challenges?id_modulo=${mod.id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("cerebrito_token")}` },
          })
            .then((r) => r.json())
            .then((ch) => setChallenges(Array.isArray(ch) ? ch : []));
        }
      })
      .catch(console.error);

    // Carga intentos guardados
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
    <div className="space-y-6">
      {/* Bienvenida */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/5 border border-primary/20"
      >
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
      </motion.div>

      {/* Estadisticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Trophy} label="Puntos" value={user.puntos_totales} color="#0EA5E9" delay={0.1} />
        <StatCard icon={Zap} label="Retos" value={user.retos_completados} color="#22C55E" delay={0.15} />
        <StatCard icon={Flame} label="Racha" value={`${user.racha_dias}d`} color="#F59E0B" delay={0.2} />
        <StatCard icon={Star} label="Grado" value={`${user.grado_bachillerato}°`} color="#A855F7" delay={0.25} />
      </div>

      {/* Intentos guardados (retos pendientes) */}
      {savedAttempts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
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
                  <Link href={`/challenge/${attempt.id_reto}`}>
                    <Button size="sm" variant="outline" className="flex-shrink-0">
                      Continuar
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Retos disponibles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Retos Disponibles
          </h2>
          <Link href="/modules">
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              Ver todo <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>

        {challenges.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            Cargando retos disponibles...
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {challenges.slice(0, 4).map((challenge, i) => {
              const color = tipoColors[challenge.tipo_juego] || "#0EA5E9";
              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
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
                          style={{
                            borderColor: `${color}40`,
                            color: color,
                          }}
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
                  <Link href={`/challenge/${challenge.id}`}>
                    <Button size="sm" className="w-full mt-3 gap-2 h-8 text-xs">
                      <Play className="w-3 h-3" />
                      Iniciar Reto
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Niveles del modulo */}
      {levels.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-secondary" />
            Tu Progreso
          </h2>
          <div className="space-y-2">
            {levels.map((level, i) => (
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
        </motion.div>
      )}
    </div>
  );
}

// Dashboard para docentes
function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalChallenges: 0,
    totalResults: 0,
    avgScore: 0,
  });

  // Carga estadisticas generales
  useEffect(() => {
    Promise.all([
      fetch("/api/ranking", {
        headers: { Authorization: `Bearer ${localStorage.getItem("cerebrito_token")}` },
      }).then((r) => r.json()),
      fetch("/api/challenges", {
        headers: { Authorization: `Bearer ${localStorage.getItem("cerebrito_token")}` },
      }).then((r) => r.json()),
    ])
      .then(([ranking, challenges]) => {
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
      })
      .catch(console.error);
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Bienvenida docente */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-secondary/10 to-accent/5 border border-secondary/20"
      >
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
      </motion.div>

      {/* Estadisticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Estudiantes" value={stats.totalStudents} color="#A855F7" delay={0.1} />
        <StatCard icon={Zap} label="Retos" value={stats.totalChallenges} color="#0EA5E9" delay={0.15} />
        <StatCard icon={TrendingUp} label="Resultados" value={stats.totalResults} color="#22C55E" delay={0.2} />
        <StatCard icon={Star} label="Prom. Puntos" value={stats.avgScore} color="#F59E0B" delay={0.25} />
      </div>

      {/* Acciones rapidas docente */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
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
              <motion.div
                whileHover={{ y: -3, scale: 1.02 }}
                className="p-4 rounded-xl bg-card/60 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="text-sm font-semibold">{label}</div>
                <div className="text-xs text-muted-foreground mt-1">{desc}</div>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Enlace al ranking y modulos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid sm:grid-cols-2 gap-3"
      >
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
      </motion.div>
    </div>
  );
}

// Componente principal del dashboard
export function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  return user.rol === "docente" ? <TeacherDashboard /> : <StudentDashboard />;
}
