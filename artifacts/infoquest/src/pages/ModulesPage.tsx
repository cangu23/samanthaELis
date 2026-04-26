// Pagina de modulos: muestra los 3 modulos del curriculo (docentes) o el modulo del grado (estudiantes)
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, BookOpen, Zap, Lock } from "lucide-react";

interface Modulo {
  id: number;
  nombre: string;
  anio_bachillerato: number;
  descripcion: string;
  color: string;
  icono: string;
  activo: boolean;
}

interface Nivel {
  id: number;
  nombre: string;
  orden: number;
  descripcion: string;
  puntos_por_reto: number;
  activo: boolean;
}

interface Reto {
  id: number;
  nombre: string;
  tipo_juego: string;
  puntos_maximos: number;
  id_nivel: number;
}

const tipoLabels: Record<string, string> = {
  quiz: "Quiz",
  code_challenge: "Codigo",
  security_puzzle: "Seguridad",
  drag_drop: "Drag & Drop",
  speed_race: "Velocidad",
};

export function ModulesPage() {
  const { user } = useAuth();
  const [modules, setModules] = useState<Modulo[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [levels, setLevels] = useState<Record<number, Nivel[]>>({});
  const [challenges, setChallenges] = useState<Record<number, Reto[]>>({});
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("infoquest_token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch("/api/modules", { headers })
      .then((r) => r.json())
      .then((data) => {
        const mods = Array.isArray(data) ? data : data.modules || [];
        setModules(mods);
        // Para estudiantes, expande automaticamente su modulo
        if (user?.rol === "estudiante" && user.grado_bachillerato) {
          const myMod = mods.find((m: Modulo) => m.anio_bachillerato === user.grado_bachillerato);
          if (myMod) {
            setExpanded(myMod.id);
            loadModuleDetails(myMod.id);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadModuleDetails = (moduleId: number) => {
    if (levels[moduleId]) return;
    fetch(`/api/modules/${moduleId}/levels`, { headers })
      .then((r) => r.json())
      .then((lvls) => {
        setLevels((prev) => ({
          ...prev,
          [moduleId]: Array.isArray(lvls) ? lvls : [],
        }));
      })
      .catch(console.error);
    fetch(`/api/challenges?id_modulo=${moduleId}`, { headers })
      .then((r) => r.json())
      .then((ch) => {
        setChallenges((prev) => ({
          ...prev,
          [moduleId]: Array.isArray(ch) ? ch : [],
        }));
      })
      .catch(console.error);
  };

  const handleToggle = (moduleId: number) => {
    if (expanded === moduleId) {
      setExpanded(null);
    } else {
      setExpanded(moduleId);
      loadModuleDetails(moduleId);
    }
  };

  // Para estudiantes, filtra solo su modulo
  const visibleModules =
    user?.rol === "estudiante" && user.grado_bachillerato
      ? modules.filter((m) => m.anio_bachillerato === user.grado_bachillerato)
      : modules;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold font-orbitron">Modulos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {user?.rol === "docente"
            ? "Todos los modulos del curriculo de Bachillerato en Informatica"
            : `Contenido de tu ${user?.grado_bachillerato}° Bachillerato`}
        </p>
      </div>

      <div className="space-y-4">
        {visibleModules.map((mod, i) => {
          const isOpen = expanded === mod.id;
          const modLevels = levels[mod.id] || [];
          const modChallenges = challenges[mod.id] || [];
          const isAccessible =
            user?.rol === "docente" || mod.anio_bachillerato === user?.grado_bachillerato;

          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl border overflow-hidden transition-all ${
                isAccessible ? "border-border/50" : "border-border/30 opacity-70"
              }`}
            >
              {/* Header del modulo */}
              <button
                className="w-full p-5 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors"
                onClick={() => isAccessible && handleToggle(mod.id)}
                disabled={!isAccessible}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${mod.color}20`,
                    border: `2px solid ${mod.color}50`,
                  }}
                >
                  {isAccessible ? (
                    <BookOpen className="w-6 h-6" style={{ color: mod.color }} />
                  ) : (
                    <Lock className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      className="text-xs font-bold px-2"
                      style={{
                        backgroundColor: `${mod.color}20`,
                        color: mod.color,
                        borderColor: `${mod.color}40`,
                      }}
                    >
                      {mod.anio_bachillerato}° Bachillerato
                    </Badge>
                    {!isAccessible && (
                      <Badge variant="outline" className="text-xs">
                        Bloqueado
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-base font-bold mt-1">{mod.nombre}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {mod.descripcion}
                  </p>
                </div>
                <ChevronRight
                  className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${
                    isOpen ? "rotate-90" : ""
                  }`}
                />
              </button>

              {/* Contenido expandido */}
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border/50 bg-muted/10"
                >
                  {/* Niveles */}
                  <div className="p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Niveles
                    </h3>
                    {modLevels.length === 0 ? (
                      <div className="text-xs text-muted-foreground py-2">Cargando niveles...</div>
                    ) : (
                      modLevels.map((level) => {
                        const levelChallenges = modChallenges.filter(
                          (c) => c.id_nivel === level.id
                        );
                        return (
                          <div key={level.id} className="rounded-xl bg-card/60 border border-border/40 overflow-hidden">
                            <div className="p-3 flex items-center gap-3">
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{
                                  backgroundColor: `${mod.color}20`,
                                  color: mod.color,
                                  border: `1px solid ${mod.color}40`,
                                }}
                              >
                                {level.orden}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium">{level.nombre}</div>
                                <div className="text-xs text-muted-foreground">{level.descripcion}</div>
                              </div>
                              <span className="text-xs text-muted-foreground">{level.puntos_por_reto} pts</span>
                            </div>

                            {/* Retos del nivel */}
                            {levelChallenges.length > 0 && (
                              <div className="px-3 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {levelChallenges.map((ch) => (
                                  <Link key={ch.id} href={`/challenge/${ch.id}`}>
                                    <motion.div
                                      whileHover={{ scale: 1.02 }}
                                      className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border/40 hover:border-primary/30 transition-colors cursor-pointer"
                                    >
                                      <Zap className="w-3 h-3 text-primary flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium truncate">{ch.nombre}</div>
                                        <Badge
                                          variant="outline"
                                          className="text-xs px-1 py-0 mt-0.5"
                                        >
                                          {tipoLabels[ch.tipo_juego] || ch.tipo_juego}
                                        </Badge>
                                      </div>
                                      <span className="text-xs font-bold text-primary whitespace-nowrap">
                                        {ch.puntos_maximos}p
                                      </span>
                                    </motion.div>
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
