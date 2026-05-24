// Pagina de exploración de juegos: muestra todos los retos disponibles con búsqueda y filtros
import { useEffect, useState, useMemo } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contextos/AuthContext";
import { Badge } from "@/componentes/interfaz/badge";
import {
  Search, X, Zap, Clock, Star, BookOpen, Gamepad2,
  Grid3X3, AlignJustify, ShieldCheck, Code2, Wind, Puzzle,
} from "lucide-react";
import { cn } from "@/utilidades/utils";

interface Reto {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipo_juego: string;
  puntos_maximos: number;
  tiempo_limite: number;
  id_modulo: number;
  id_nivel: number;
  modulo: { nombre: string; color: string } | null;
  nivel: { nombre: string } | null;
  is_custom?: boolean;
  docente_nombre?: string | null;
}

const TIPO_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  quiz:             { label: "Quiz",            color: "#0EA5E9", icon: BookOpen    },
  code_challenge:   { label: "Código",          color: "#A855F7", icon: Code2       },
  security_puzzle:  { label: "Seguridad",       color: "#22C55E", icon: ShieldCheck },
  drag_drop:        { label: "Drag & Drop",     color: "#F59E0B", icon: Grid3X3     },
  speed_race:       { label: "Velocidad",       color: "#EF4444", icon: Wind        },
  word_search:      { label: "Sopa de Letras",  color: "#06B6D4", icon: AlignJustify},
  crossword:        { label: "Crucigrama",      color: "#8B5CF6", icon: Puzzle      },
};

const ALL_TYPES = Object.keys(TIPO_CONFIG);

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function JuegosPage() {
  const { user } = useAuth();
  const token = localStorage.getItem("cerebrito_token");
  const headers = { Authorization: `Bearer ${token}` };

  const [retos, setRetos] = useState<Reto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/challenges", { headers })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.challenges || [];
        setRetos(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Tipos que realmente existen en los retos
  const tiposDisponibles = useMemo(
    () => ALL_TYPES.filter((t) => retos.some((r) => r.tipo_juego === t)),
    [retos]
  );

  // Filtrado por búsqueda y tipo
  const query = search.toLowerCase().trim();
  const filtrados = useMemo(() => {
    return retos.filter((r) => {
      const matchesTipo = filterTipo ? r.tipo_juego === filterTipo : true;
      if (!query) return matchesTipo;
      const cfg = TIPO_CONFIG[r.tipo_juego];
      const matchesQuery =
        r.nombre.toLowerCase().includes(query) ||
        (r.descripcion ?? "").toLowerCase().includes(query) ||
        (r.modulo?.nombre ?? "").toLowerCase().includes(query) ||
        (r.nivel?.nombre ?? "").toLowerCase().includes(query) ||
        (cfg?.label ?? r.tipo_juego).toLowerCase().includes(query);
      return matchesTipo && matchesQuery;
    });
  }, [retos, query, filterTipo]);

  // Agrupar por tipo para la vista en grid
  const porTipo = useMemo(() => {
    const grupos: Record<string, Reto[]> = {};
    const lista = filterTipo ? filtrados : filtrados;
    lista.forEach((r) => {
      if (!grupos[r.tipo_juego]) grupos[r.tipo_juego] = [];
      grupos[r.tipo_juego].push(r);
    });
    return grupos;
  }, [filtrados, filterTipo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold font-orbitron flex items-center gap-2">
          <Gamepad2 className="w-6 h-6 text-primary" />
          Explorar Juegos
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {user?.rol === "docente"
            ? "Todos los retos disponibles en la plataforma"
            : "Busca un tema y elige tu tipo de reto favorito"}
        </p>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Busca por tema, ej: "Python", "IA", "Redes", "Seguridad"...'
          className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
          autoFocus
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filtros por tipo de juego */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium">Tipo:</span>
        <button
          onClick={() => setFilterTipo(null)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
            filterTipo === null
              ? "bg-primary/20 text-primary border-primary/40"
              : "bg-muted/30 text-muted-foreground border-border/50 hover:border-border"
          )}
        >
          Todos ({retos.length})
        </button>
        {tiposDisponibles.map((tipo) => {
          const cfg = TIPO_CONFIG[tipo];
          const count = retos.filter((r) => r.tipo_juego === tipo).length;
          const active = filterTipo === tipo;
          return (
            <button
              key={tipo}
              onClick={() => setFilterTipo(active ? null : tipo)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
              style={{
                backgroundColor: active ? `${cfg.color}25` : "transparent",
                color: active ? cfg.color : undefined,
                borderColor: active ? `${cfg.color}50` : undefined,
              }}
            >
              {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Sin resultados */}
      {filtrados.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Sin resultados</p>
          <p className="text-sm mt-1">
            Intenta con otro término como "Python", "SQL", "Redes"
          </p>
        </div>
      )}

      {/* Retos agrupados por tipo */}
      {Object.entries(porTipo).map(([tipo, lista]) => {
        const cfg = TIPO_CONFIG[tipo] ?? { label: tipo, color: "#888", icon: Zap };
        const Icon = cfg.icon;
        return (
          <div key={tipo} className="space-y-3">
            {/* Encabezado del grupo */}
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${cfg.color}20`, border: `1px solid ${cfg.color}40` }}
              >
                <Icon className="w-4 h-4" style={{ color: cfg.color }} />
              </div>
              <h2 className="font-semibold font-orbitron text-sm" style={{ color: cfg.color }}>
                {cfg.label}
              </h2>
              <span className="text-xs text-muted-foreground">({lista.length} reto{lista.length !== 1 ? "s" : ""})</span>
            </div>

            {/* Tarjetas de retos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lista.map((reto) => (
                <Link key={reto.id} href={`/challenge/${reto.id}`}>
                  <div
                    className="group p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg"
                    style={{
                      backgroundColor: `${cfg.color}08`,
                      borderColor: `${cfg.color}25`,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = `${cfg.color}60`;
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = `${cfg.color}15`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = `${cfg.color}25`;
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = `${cfg.color}08`;
                    }}
                  >
                    {/* Nombre del reto */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm text-foreground group-hover:text-white transition-colors line-clamp-2">
                        {reto.nombre}
                      </h3>
                      {reto.is_custom && (
                        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          Docente
                        </span>
                      )}
                    </div>

                    {/* Módulo y nivel */}
                    {reto.modulo && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        📚 {reto.modulo.nombre}
                        {reto.nivel && ` · ${reto.nivel.nombre}`}
                      </p>
                    )}
                    {reto.is_custom && reto.docente_nombre && (
                      <p className="text-xs text-purple-400/70 mt-0.5 truncate">
                        👨‍🏫 {reto.docente_nombre}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-3 mt-3">
                      <span
                        className="flex items-center gap-1 text-xs font-medium"
                        style={{ color: cfg.color }}
                      >
                        <Star className="w-3 h-3" />
                        {reto.puntos_maximos} pts
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatTime(reto.tiempo_limite)}
                      </span>
                      <Badge
                        className="ml-auto text-xs px-1.5 py-0"
                        style={{
                          backgroundColor: `${cfg.color}20`,
                          color: cfg.color,
                          borderColor: `${cfg.color}40`,
                        }}
                      >
                        Jugar →
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
