// Pagina de perfil del usuario con estadisticas y historial de retos
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RobotMascot } from "@/components/mascot/RobotMascot";
import {
  Trophy,
  Zap,
  Flame,
  Star,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Result {
  id: number;
  nombre_reto: string;
  tipo_juego: string;
  puntaje: number;
  puntos_maximos: number;
  respuestas_correctas: number;
  total_preguntas: number;
  completado: boolean;
  fecha_completado: string;
}

const tipoLabels: Record<string, string> = {
  quiz: "Quiz",
  code_challenge: "Codigo",
  security_puzzle: "Seguridad",
  drag_drop: "Drag & Drop",
  speed_race: "Velocidad",
};

export function ProfilePage() {
  const { user } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("infoquest_token");

  useEffect(() => {
    fetch("/api/results/my-history", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setResults(Array.isArray(data) ? data : data.results || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const isDocente = user.rol === "docente";
  const avgAccuracy =
    results.length > 0
      ? Math.round(
          (results.reduce(
            (s, r) => s + r.respuestas_correctas / Math.max(r.total_preguntas, 1),
            0
          ) /
            results.length) *
            100
        )
      : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Perfil header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start"
      >
        <RobotMascot size="md" mood="happy" className="flex-shrink-0" />

        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
            <h1 className="text-2xl font-bold">{user.nombre}</h1>
            <Badge
              className={
                isDocente
                  ? "bg-secondary/20 text-secondary border-secondary/30"
                  : "bg-primary/20 text-primary border-primary/30"
              }
            >
              {isDocente ? "Docente" : `${user.grado_bachillerato}° Bachillerato`}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">@{user.usuario}</p>

          {user.ultimo_acceso && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-center sm:justify-start">
              <Calendar className="w-3 h-3" />
              Ultimo acceso:{" "}
              {formatDistanceToNow(new Date(user.ultimo_acceso), {
                addSuffix: true,
                locale: es,
              })}
            </p>
          )}

          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { icon: Trophy, label: "Puntos", value: user.puntos_totales.toLocaleString(), color: "#0EA5E9" },
              { icon: Zap, label: "Retos", value: user.retos_completados, color: "#22C55E" },
              { icon: Flame, label: "Racha", value: `${user.racha_dias}d`, color: "#F59E0B" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div
                key={label}
                className="p-2 rounded-lg text-center"
                style={{ backgroundColor: `${color}10`, border: `1px solid ${color}20` }}
              >
                <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
                <div className="text-base font-bold font-orbitron" style={{ color }}>
                  {value}
                </div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Estadisticas de precision */}
      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-4"
        >
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" />
            Estadisticas Generales
          </h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Precision Media</span>
                <span className="font-bold text-primary">{avgAccuracy}%</span>
              </div>
              <Progress value={avgAccuracy} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <span className="text-muted-foreground">
                  Retos completados:{" "}
                  <span className="font-bold text-foreground">{results.filter((r) => r.completado).length}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">
                  Mejor puntaje:{" "}
                  <span className="font-bold text-foreground">
                    {results.length > 0 ? Math.max(...results.map((r) => r.puntaje)) : 0}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Historial de retos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          Historial de Retos
        </h2>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Aun no has completado ningun reto</p>
            <p className="text-xs mt-1">Ve a los modulos para empezar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {results.map((result, i) => {
              const accuracy =
                result.total_preguntas > 0
                  ? Math.round((result.respuestas_correctas / result.total_preguntas) * 100)
                  : 0;
              const scorePercent = result.puntos_maximos > 0
                ? Math.round((result.puntaje / result.puntos_maximos) * 100)
                : 0;

              return (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card/60 border border-border/40"
                >
                  {result.completado ? (
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{result.nombre_reto}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {tipoLabels[result.tipo_juego] || result.tipo_juego}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {result.respuestas_correctas}/{result.total_preguntas} correctas
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-primary">{result.puntaje} pts</div>
                    <div className="text-xs text-muted-foreground">{accuracy}% precision</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
