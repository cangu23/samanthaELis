// Pagina de ranking: tabla de clasificacion con tiers de colores
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Zap, Flame, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

interface RankedUser {
  posicion: number;
  usuario_id: number;
  nombre: string;
  usuario: string;
  puntos_totales: number;
  retos_completados: number;
  grado_bachillerato: number | null;
  rol: string;
}

// Determina el tier de color segun la posicion
function getTier(pos: number): { label: string; color: string; bg: string; border: string } {
  if (pos === 1) return { label: "Oro", color: "#F59E0B", bg: "ranking-gold", border: "border-yellow-400/40" };
  if (pos === 2) return { label: "Plata", color: "#9CA3AF", bg: "ranking-silver", border: "border-gray-400/40" };
  if (pos === 3) return { label: "Bronce", color: "#CD7F32", bg: "ranking-bronze", border: "border-orange-600/40" };
  if (pos <= 10) return { label: "Elite", color: "#0EA5E9", bg: "", border: "border-primary/20" };
  if (pos <= 25) return { label: "Pro", color: "#A855F7", bg: "", border: "border-secondary/20" };
  return { label: "Novato", color: "#22C55E", bg: "", border: "border-accent/20" };
}

const MedalIcon = ({ pos }: { pos: number }) => {
  if (pos === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
  if (pos === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (pos === 3) return <Medal className="w-5 h-5 text-orange-600" />;
  return <span className="text-sm font-bold font-orbitron text-muted-foreground w-5 text-center">{pos}</span>;
};

export function RankingPage() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGrado, setFilterGrado] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/ranking", {
      headers: { Authorization: `Bearer ${localStorage.getItem("infoquest_token")}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.ranking || [];
        setRanking(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredRanking = filterGrado
    ? ranking.filter((r) => r.grado_bachillerato === filterGrado)
    : ranking;

  // Posicion del usuario actual en el ranking
  const myPosition = ranking.find((r) => r.usuario_id === user?.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-orbitron flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          Tabla de Clasificacion
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Los mejores estudiantes del Nacional Cumbaya
        </p>
      </div>

      {/* Mi posicion (si es estudiante) */}
      {user?.rol === "estudiante" && myPosition && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border border-primary/30 bg-primary/10 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold font-orbitron text-primary">
            #{myPosition.posicion}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Tu Posicion</div>
            <div className="text-xs text-muted-foreground">{myPosition.puntos_totales.toLocaleString()} puntos · {myPosition.retos_completados} retos</div>
          </div>
          <Badge className="bg-primary/20 text-primary border-primary/30">
            {getTier(myPosition.posicion).label}
          </Badge>
        </motion.div>
      )}

      {/* Top 3 podio */}
      {filteredRanking.length >= 3 && !filterGrado && (
        <div className="grid grid-cols-3 gap-3">
          {/* 2° lugar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="pt-8 flex flex-col items-center"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-xl font-bold mb-2">
              {filteredRanking[1]?.nombre?.charAt(0)?.toUpperCase()}
            </div>
            <div className="text-sm font-semibold text-center truncate w-full px-1">
              {filteredRanking[1]?.nombre?.split(" ")[0]}
            </div>
            <div className="text-xs text-muted-foreground">{filteredRanking[1]?.puntos_totales?.toLocaleString()} pts</div>
            <div className="mt-2 w-full h-20 bg-gradient-to-t from-gray-400/20 to-transparent rounded-t-xl border border-gray-400/30 flex items-end justify-center pb-2">
              <span className="font-bold font-orbitron text-gray-400 text-2xl">2</span>
            </div>
          </motion.div>

          {/* 1° lugar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="flex flex-col items-center"
          >
            <div className="relative">
              <Trophy className="w-6 h-6 text-yellow-400 absolute -top-5 left-1/2 -translate-x-1/2" />
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white text-2xl font-bold mb-2 border-2 border-yellow-400">
                {filteredRanking[0]?.nombre?.charAt(0)?.toUpperCase()}
              </div>
            </div>
            <div className="text-sm font-semibold text-center truncate w-full px-1">
              {filteredRanking[0]?.nombre?.split(" ")[0]}
            </div>
            <div className="text-xs text-yellow-400 font-bold">{filteredRanking[0]?.puntos_totales?.toLocaleString()} pts</div>
            <div className="mt-2 w-full h-32 bg-gradient-to-t from-yellow-400/20 to-transparent rounded-t-xl border border-yellow-400/40 flex items-end justify-center pb-2">
              <span className="font-bold font-orbitron text-yellow-400 text-3xl">1</span>
            </div>
          </motion.div>

          {/* 3° lugar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="pt-12 flex flex-col items-center"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-600 to-orange-800 flex items-center justify-center text-white text-lg font-bold mb-2">
              {filteredRanking[2]?.nombre?.charAt(0)?.toUpperCase()}
            </div>
            <div className="text-sm font-semibold text-center truncate w-full px-1">
              {filteredRanking[2]?.nombre?.split(" ")[0]}
            </div>
            <div className="text-xs text-muted-foreground">{filteredRanking[2]?.puntos_totales?.toLocaleString()} pts</div>
            <div className="mt-2 w-full h-14 bg-gradient-to-t from-orange-600/20 to-transparent rounded-t-xl border border-orange-600/30 flex items-end justify-center pb-2">
              <span className="font-bold font-orbitron text-orange-600 text-2xl">3</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Filtros por grado */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Filtrar:</span>
        {[null, 1, 2, 3].map((g) => (
          <button
            key={g ?? "all"}
            onClick={() => setFilterGrado(g)}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-medium transition-colors border",
              filterGrado === g
                ? "bg-primary/20 text-primary border-primary/40"
                : "bg-muted/30 text-muted-foreground border-border/50 hover:border-border"
            )}
          >
            {g === null ? "Todos" : `${g}° Bachillerato`}
          </button>
        ))}
      </div>

      {/* Lista completa */}
      <div className="space-y-2">
        {filteredRanking.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No hay estudiantes en el ranking aun
          </div>
        ) : (
          filteredRanking.map((item, i) => {
            const tier = getTier(item.posicion);
            const isMe = item.usuario_id === user?.id;

            return (
              <motion.div
                key={item.usuario_id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all",
                  tier.bg,
                  tier.border,
                  isMe && "ring-1 ring-primary/50"
                )}
              >
                {/* Posicion */}
                <div className="w-8 flex items-center justify-center flex-shrink-0">
                  <MedalIcon pos={item.posicion} />
                </div>

                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${tier.color}40, ${tier.color}20)`,
                    border: `1px solid ${tier.color}50`,
                    color: tier.color,
                  }}
                >
                  {item.nombre.charAt(0).toUpperCase()}
                </div>

                {/* Info usuario */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-semibold truncate", isMe && "text-primary")}>
                      {item.nombre}
                    </span>
                    {isMe && <Badge className="text-xs bg-primary/20 text-primary border-primary/30 py-0">Tu</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>@{item.usuario}</span>
                    {item.grado_bachillerato && (
                      <span>{item.grado_bachillerato}° Bach.</span>
                    )}
                  </div>
                </div>

                {/* Puntos y retos */}
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 justify-end" style={{ color: tier.color }}>
                    <Star className="w-3.5 h-3.5" />
                    <span className="font-bold font-orbitron text-sm">
                      {item.puntos_totales.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 justify-end mt-0.5 text-xs text-muted-foreground">
                    <Zap className="w-3 h-3" />
                    <span>{item.retos_completados} retos</span>
                  </div>
                </div>

                {/* Badge tier */}
                <Badge
                  variant="outline"
                  className="hidden sm:flex text-xs px-1.5 flex-shrink-0"
                  style={{ borderColor: `${tier.color}50`, color: tier.color }}
                >
                  {tier.label}
                </Badge>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
