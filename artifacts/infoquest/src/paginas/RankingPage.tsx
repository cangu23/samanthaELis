// Ranking: tabla completa con puntos, correctas, incorrectas, tiempo y botón para retar
import { useEffect, useState } from "react";
import { useAuth } from "@/contextos/AuthContext";
import { Badge } from "@/componentes/interfaz/badge";
import { Button } from "@/componentes/interfaz/button";
import { Separator } from "@/componentes/interfaz/separator";
import { Trophy, Star, Zap, Medal, Swords, CheckCircle2, XCircle, Clock, Target, Copy, Check } from "lucide-react";
import { cn } from "@/utilidades/utils";

interface RankedUser {
  posicion: number;
  usuario_id: number;
  nombre: string;
  usuario: string;
  puntos_totales: number;
  retos_completados: number;
  grado_bachillerato: number | null;
  rol: string;
  precision_promedio: number;
  tiempo_promedio: number;
  respuestas_correctas: number;
  respuestas_incorrectas: number;
}

interface Reto { id: number; nombre: string; tipo_juego: string; }

function getTier(pos: number) {
  if (pos === 1) return { label: "Oro",    color: "#F59E0B", ring: "ring-yellow-400/40" };
  if (pos === 2) return { label: "Plata",  color: "#9CA3AF", ring: "ring-gray-400/40" };
  if (pos === 3) return { label: "Bronce", color: "#CD7F32", ring: "ring-orange-600/40" };
  if (pos <= 10) return { label: "Elite",  color: "#0EA5E9", ring: "" };
  if (pos <= 25) return { label: "Pro",    color: "#A855F7", ring: "" };
  return             { label: "Novato",  color: "#22C55E", ring: "" };
}

function PosIcon({ pos }: { pos: number }) {
  if (pos === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
  if (pos === 2) return <Medal  className="w-5 h-5 text-gray-400" />;
  if (pos === 3) return <Medal  className="w-5 h-5 text-orange-500" />;
  return <span className="font-orbitron text-sm font-bold text-muted-foreground w-5 text-center">{pos}</span>;
}

function formatTime(secs: number) {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function RankingPage() {
  const { user } = useAuth();
  const token = localStorage.getItem("cerebrito_token");
  const headers = { Authorization: `Bearer ${token}` };

  const [ranking, setRanking]       = useState<RankedUser[]>([]);
  const [retos, setRetos]           = useState<Reto[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filterGrado, setFilterGrado] = useState<number | null>(null);

  const [retarTarget, setRetarTarget] = useState<RankedUser | null>(null);
  const [retoSeleccionado, setRetoSeleccionado] = useState<string>("");
  const [enviando, setEnviando]     = useState(false);
  const [retadoOk, setRetadoOk]     = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);

  useEffect(() => {
    fetch("/api/ranking", { headers })
      .then((r) => r.json())
      .then((data) => setRanking(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
    fetch("/api/challenges", { headers })
      .then((r) => r.json())
      .then((data) => setRetos(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const filteredRanking = filterGrado
    ? ranking.filter((r) => r.grado_bachillerato === filterGrado)
    : ranking;

  const myPos = ranking.find((r) => r.usuario_id === user?.id);

  const enviarDesafio = async () => {
    if (!retarTarget || !retoSeleccionado) return;
    setEnviando(true);
    const reto = retos.find((r) => String(r.id) === retoSeleccionado);
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          id_destinatario: retarTarget.usuario_id,
          contenido: `⚔️ ¡Te desafío a competir en "${reto?.nombre}"! Entra a Cerebrito y acepta el reto: /challenge/${retoSeleccionado}`,
        }),
      });
      setRetadoOk(true);
    } catch { /* silent */ }
    setEnviando(false);
  };

  const copiarLink = () => {
    if (!retoSeleccionado) return;
    const url = `${window.location.origin}/challenge/${retoSeleccionado}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2500);
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5 page-enter">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-orbitron flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" /> Ranking
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Clasificación global de estudiantes · {filteredRanking.length} jugadores
          </p>
        </div>
        {myPos && (
          <div className="text-right hidden sm:block">
            <p className="text-xs text-muted-foreground">Tu posición</p>
            <p className="text-2xl font-orbitron font-bold" style={{ color: getTier(myPos.posicion).color }}>
              #{myPos.posicion}
            </p>
          </div>
        )}
      </div>

      {/* Podio top 3 */}
      {filteredRanking.length >= 3 && !filterGrado && (
        <div className="grid grid-cols-3 gap-3 pb-2">
          {[filteredRanking[1], filteredRanking[0], filteredRanking[2]].map((item, idx) => {
            const isFirst = idx === 1;
            const tier = getTier(item.posicion);
            const heights = ["h-20", "h-32", "h-14"];
            return (
              <div
                key={item.usuario_id}
                className={cn("flex flex-col items-center", idx === 0 ? "pt-8" : idx === 2 ? "pt-12" : "")}
              >
                <div
                  className={cn("rounded-full flex items-center justify-center text-white font-bold mb-1.5 ring-2", tier.ring,
                    isFirst ? "w-16 h-16 text-2xl" : "w-12 h-12 text-base"
                  )}
                  style={{ background: `linear-gradient(135deg, ${tier.color}80, ${tier.color}40)` }}
                >
                  {item.nombre?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                <p className="text-xs font-semibold text-center truncate w-full px-1">{item.nombre?.split(" ")[0] ?? item.usuario}</p>
                <p className="text-xs font-orbitron font-bold" style={{ color: tier.color }}>
                  {(item.puntos_totales ?? 0).toLocaleString()} pts
                </p>
                <div
                  className={cn("mt-2 w-full rounded-t-xl border flex items-end justify-center pb-2", heights[idx])}
                  style={{ background: `linear-gradient(to top, ${tier.color}25, transparent)`, borderColor: `${tier.color}40` }}
                >
                  <span className="font-orbitron font-bold text-2xl" style={{ color: tier.color }}>{item.posicion}</span>
                </div>
              </div>
            );
          })}
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
              "px-3 py-1 rounded-lg text-xs font-medium border transition-colors",
              filterGrado === g
                ? "bg-primary/20 text-primary border-primary/40"
                : "bg-muted/30 text-muted-foreground border-border/50 hover:border-border"
            )}
          >
            {g === null ? `Todos (${ranking.length})` : `${g}° Bachillerato`}
          </button>
        ))}
      </div>

      {/* TABLA COMPLETA */}
      <div className="overflow-x-auto rounded-xl border border-border/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/20">
              <th className="py-3 px-3 text-left text-xs text-muted-foreground font-semibold w-10">#</th>
              <th className="py-3 px-3 text-left text-xs text-muted-foreground font-semibold">Jugador</th>
              <th className="py-3 px-3 text-right text-xs text-muted-foreground font-semibold">
                <span className="flex items-center justify-end gap-1"><Star className="w-3 h-3 text-yellow-400" />Puntos</span>
              </th>
              <th className="py-3 px-3 text-right text-xs text-muted-foreground font-semibold">
                <span className="flex items-center justify-end gap-1"><CheckCircle2 className="w-3 h-3 text-green-400" />Correctas</span>
              </th>
              <th className="py-3 px-3 text-right text-xs text-muted-foreground font-semibold">
                <span className="flex items-center justify-end gap-1"><XCircle className="w-3 h-3 text-red-400" />Incorrectas</span>
              </th>
              <th className="py-3 px-3 text-right text-xs text-muted-foreground font-semibold">
                <span className="flex items-center justify-end gap-1"><Target className="w-3 h-3 text-blue-400" />Precisión</span>
              </th>
              <th className="py-3 px-3 text-right text-xs text-muted-foreground font-semibold">
                <span className="flex items-center justify-end gap-1"><Clock className="w-3 h-3 text-purple-400" />T. Promedio</span>
              </th>
              <th className="py-3 px-3 text-right text-xs text-muted-foreground font-semibold">
                <span className="flex items-center justify-end gap-1"><Zap className="w-3 h-3" />Retos</span>
              </th>
              <th className="py-3 px-3 text-center text-xs text-muted-foreground font-semibold">Retar</th>
            </tr>
          </thead>
          <tbody>
            {filteredRanking.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-muted-foreground text-sm">
                  No hay estudiantes en el ranking aún
                </td>
              </tr>
            )}
            {filteredRanking.map((item) => {
              const tier = getTier(item.posicion);
              const isMe = item.usuario_id === user?.id;
              const precision = item.precision_promedio ? Math.round(item.precision_promedio) : 0;
              return (
                <tr
                  key={item.usuario_id}
                  className={cn(
                    "border-b border-border/30 transition-colors hover:bg-muted/10",
                    isMe && "bg-primary/5"
                  )}
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center w-8">
                      <PosIcon pos={item.posicion} />
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${tier.color}40, ${tier.color}20)`, border: `1px solid ${tier.color}50`, color: tier.color }}
                      >
                        {item.nombre?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <div className={cn("font-semibold text-sm", isMe && "text-primary")}>
                          {item.nombre ?? item.usuario}
                          {isMe && <Badge className="ml-1.5 text-xs bg-primary/20 text-primary border-primary/30 py-0 px-1">Tú</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          @{item.usuario}
                          {item.grado_bachillerato && ` · ${item.grado_bachillerato}° Bach.`}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span className="font-orbitron font-bold text-sm" style={{ color: tier.color }}>
                      {(item.puntos_totales ?? 0).toLocaleString()}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span className="text-green-400 font-medium">{item.respuestas_correctas ?? 0}</span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span className="text-red-400 font-medium">{item.respuestas_incorrectas ?? 0}</span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-16 h-1.5 rounded-full bg-muted/40 overflow-hidden hidden sm:block">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${precision}%`, backgroundColor: precision >= 70 ? "#22C55E" : precision >= 40 ? "#F59E0B" : "#EF4444" }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{precision}%</span>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right text-xs text-muted-foreground">
                    {formatTime(item.tiempo_promedio)}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span className="text-xs font-medium text-muted-foreground">{item.retos_completados ?? 0}</span>
                  </td>

                  <td className="py-3 px-3 text-center">
                    {!isMe && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs border-orange-500/40 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
                        onClick={() => { setRetarTarget(item); setRetadoOk(false); setRetoSeleccionado(""); }}
                      >
                        <Swords className="w-3.5 h-3.5 mr-1" />Retar
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
        {[{ label: "Oro", color: "#F59E0B" }, { label: "Plata", color: "#9CA3AF" }, { label: "Bronce", color: "#CD7F32" }, { label: "Elite", color: "#0EA5E9" }, { label: "Pro", color: "#A855F7" }, { label: "Novato", color: "#22C55E" }].map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>

      {/* MODAL RETAR - sin Radix Dialog, overlay puro */}
      {retarTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={(e) => e.target === e.currentTarget && setRetarTarget(null)}
        >
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-orbitron font-bold flex items-center gap-2">
                <Swords className="w-5 h-5 text-orange-400" />
                Retar a {retarTarget.nombre?.split(" ")[0]}
              </h3>
              <button
                onClick={() => setRetarTarget(null)}
                className="text-muted-foreground hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted"
              >
                ✕
              </button>
            </div>

            {retadoOk ? (
              <div className="py-4 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
                <p className="font-semibold">¡Desafío enviado!</p>
                <p className="text-sm text-muted-foreground">
                  {retarTarget.nombre} recibirá tu desafío en su bandeja.
                </p>
                <Button onClick={() => setRetarTarget(null)} className="w-full">Listo</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Elige el reto del desafío</label>
                  <select
                    value={retoSeleccionado}
                    onChange={(e) => setRetoSeleccionado(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/60 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">Selecciona un reto...</option>
                    {retos.map((r) => (
                      <option key={r.id} value={String(r.id)}>{r.nombre}</option>
                    ))}
                  </select>
                </div>

                {retoSeleccionado && (
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/50 text-xs text-muted-foreground break-all">
                    {window.location.origin}/challenge/{retoSeleccionado}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2" disabled={!retoSeleccionado} onClick={copiarLink}>
                    {linkCopiado ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    {linkCopiado ? "¡Copiado!" : "Copiar link"}
                  </Button>
                  <Button className="flex-1 gap-2 bg-orange-500 hover:bg-orange-600" disabled={!retoSeleccionado || enviando} onClick={enviarDesafio}>
                    <Swords className="w-4 h-4" />
                    {enviando ? "Enviando..." : "Enviar desafío"}
                  </Button>
                </div>
                <Separator />
                <p className="text-xs text-muted-foreground text-center">
                  Se enviará un mensaje directo con el link del reto
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
