// Pagina para que los docentes creen retos personalizados
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contextos/AuthContext";
import { Button } from "@/componentes/interfaz/button";
import { Input } from "@/componentes/interfaz/input";
import { Label } from "@/componentes/interfaz/label";
import { Textarea } from "@/componentes/interfaz/textarea";
import { Alert, AlertDescription } from "@/componentes/interfaz/alert";
import {
  ArrowLeft, PlusCircle, Trash2, CheckCircle2, AlertCircle,
  Zap, Copy, Check, Link as LinkIcon, BookOpen, Code2, Shield,
  Zap as ZapIcon, Search, Grid3x3,
} from "lucide-react";

interface PreguntaQuiz {
  texto: string;
  tipo: "multiple_choice" | "true_false" | "code_completion";
  opciones: string[];
  respuesta_correcta: string;
  explicacion: string;
  puntos: number;
}
interface PalabraSopa { palabra: string; pista: string; }
interface PalabraCrucigrama { palabra: string; pista: string; }
type TipoJuego = "quiz" | "code_challenge" | "security_puzzle" | "speed_race" | "word_search" | "crossword";

const TIPOS_JUEGO: { value: TipoJuego; label: string; icon: React.ElementType; descripcion: string }[] = [
  { value: "quiz",             label: "Quiz",                icon: BookOpen,  descripcion: "Preguntas de opcion multiple o verdadero/falso" },
  { value: "code_challenge",   label: "Desafio de Codigo",   icon: Code2,     descripcion: "Completar o analizar fragmentos de codigo" },
  { value: "security_puzzle",  label: "Puzzle de Seguridad", icon: Shield,    descripcion: "Preguntas sobre ciberseguridad" },
  { value: "speed_race",       label: "Carrera Rapida",      icon: ZapIcon,   descripcion: "Preguntas rapidas contra el tiempo" },
  { value: "word_search",      label: "Sopa de Letras",      icon: Search,    descripcion: "Palabras que los estudiantes deben encontrar" },
  { value: "crossword",        label: "Crucigrama",          icon: Grid3x3,   descripcion: "Palabras con pistas para completar" },
];

// Clase comun para los <select> nativos
const selectCls =
  "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/60 transition-colors appearance-none cursor-pointer";

export function CreateChallengePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const token = localStorage.getItem("cerebrito_token");
  const headers = { Authorization: `Bearer ${token}` };

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipoJuego, setTipoJuego] = useState<TipoJuego>("quiz");
  const [tiempoLimite, setTiempoLimite] = useState("300");
  const [modulo, setModulo] = useState("1");

  const [preguntas, setPreguntas] = useState<PreguntaQuiz[]>([
    { texto: "", tipo: "multiple_choice", opciones: ["", "", "", ""], respuesta_correcta: "", explicacion: "", puntos: 10 },
  ]);
  const [palabrasSopa, setPalabrasSopa] = useState<PalabraSopa[]>([
    { palabra: "", pista: "" }, { palabra: "", pista: "" }, { palabra: "", pista: "" },
  ]);
  const [palabrasCrucigrama, setPalabrasCrucigrama] = useState<PalabraCrucigrama[]>([
    { palabra: "", pista: "" }, { palabra: "", pista: "" }, { palabra: "", pista: "" },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retoCreado, setRetoCreado] = useState<{ id: number; nombre: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const esJuegoConPreguntas = ["quiz", "code_challenge", "security_puzzle", "speed_race"].includes(tipoJuego);
  const esSopa = tipoJuego === "word_search";
  const esCrucigrama = tipoJuego === "crossword";

  if (user?.rol !== "docente") {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <AlertCircle className="w-10 h-10 mx-auto mb-3" />
        <p>Solo los docentes pueden crear retos personalizados</p>
      </div>
    );
  }

  // Handlers preguntas
  const addPregunta = () =>
    setPreguntas([...preguntas, { texto: "", tipo: "multiple_choice", opciones: ["", "", "", ""], respuesta_correcta: "", explicacion: "", puntos: 10 }]);
  const removePregunta = (i: number) => { if (preguntas.length > 1) setPreguntas(preguntas.filter((_, idx) => idx !== i)); };
  const updatePregunta = (i: number, field: keyof PreguntaQuiz, value: string | number | string[]) => {
    const updated = [...preguntas];
    (updated[i] as unknown as Record<string, unknown>)[field] = value;
    if (field === "tipo") {
      if (value === "true_false") updated[i].opciones = ["Verdadero", "Falso"];
      else if (value === "multiple_choice") updated[i].opciones = ["", "", "", ""];
      else updated[i].opciones = ["", ""];
      updated[i].respuesta_correcta = "";
    }
    setPreguntas(updated);
  };
  const updateOpcion = (pi: number, oi: number, value: string) => {
    const updated = [...preguntas];
    updated[pi].opciones[oi] = value;
    setPreguntas(updated);
  };

  // Handlers sopa
  const addPalabraSopa = () => setPalabrasSopa([...palabrasSopa, { palabra: "", pista: "" }]);
  const removePalabraSopa = (i: number) => { if (palabrasSopa.length > 1) setPalabrasSopa(palabrasSopa.filter((_, idx) => idx !== i)); };
  const updatePalabraSopa = (i: number, field: keyof PalabraSopa, value: string) => {
    const updated = [...palabrasSopa]; updated[i][field] = value; setPalabrasSopa(updated);
  };

  // Handlers crucigrama
  const addPalabraCrucigrama = () => setPalabrasCrucigrama([...palabrasCrucigrama, { palabra: "", pista: "" }]);
  const removePalabraCrucigrama = (i: number) => { if (palabrasCrucigrama.length > 1) setPalabrasCrucigrama(palabrasCrucigrama.filter((_, idx) => idx !== i)); };
  const updatePalabraCrucigrama = (i: number, field: keyof PalabraCrucigrama, value: string) => {
    const updated = [...palabrasCrucigrama]; updated[i][field] = value; setPalabrasCrucigrama(updated);
  };

  const linkReto = retoCreado ? `${window.location.origin}/challenge/-${retoCreado.id}` : "";
  const copiarLink = async () => {
    await navigator.clipboard.writeText(linkReto);
    setCopiado(true); setTimeout(() => setCopiado(false), 2000);
  };

  const buildPreguntasPalabras = (lista: PalabraSopa[] | PalabraCrucigrama[]): PreguntaQuiz[] =>
    lista.map((item) => ({
      texto: item.pista || item.palabra, tipo: "multiple_choice" as const,
      opciones: [item.palabra], respuesta_correcta: item.palabra.toUpperCase(),
      explicacion: "", puntos: 10,
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !descripcion.trim()) { setError("Completa el nombre y descripcion del reto"); return; }
    if (esJuegoConPreguntas) {
      for (let i = 0; i < preguntas.length; i++) {
        if (!preguntas[i].texto.trim()) { setError(`La pregunta ${i + 1} no tiene texto`); return; }
        if (!preguntas[i].respuesta_correcta.trim()) { setError(`La pregunta ${i + 1} no tiene respuesta correcta`); return; }
      }
    }
    if (esSopa && palabrasSopa.filter((p) => p.palabra.trim()).length < 3) {
      setError("Agrega al menos 3 palabras para la sopa de letras"); return;
    }
    if (esCrucigrama && palabrasCrucigrama.filter((p) => p.palabra.trim() && p.pista.trim()).length < 3) {
      setError("Agrega al menos 3 palabras con sus pistas"); return;
    }

    setLoading(true); setError("");
    try {
      const modulosRes = await fetch(`/api/modules?anio=${modulo}`, { headers });
      const modulosData = await modulosRes.json();
      const selectedModule = Array.isArray(modulosData) ? modulosData[0] : null;
      if (!selectedModule) { setError("No se encontro el modulo para ese grado"); setLoading(false); return; }

      const nivelesRes = await fetch(`/api/modules/${selectedModule.id}/levels`, { headers });
      const nivelesData = await nivelesRes.json();
      const firstLevel = Array.isArray(nivelesData) ? nivelesData[0] : null;
      if (!firstLevel) { setError("No se encontraron niveles para ese modulo"); setLoading(false); return; }

      let preguntasFinales: PreguntaQuiz[];
      if (esSopa) preguntasFinales = buildPreguntasPalabras(palabrasSopa.filter((p) => p.palabra.trim()));
      else if (esCrucigrama) preguntasFinales = buildPreguntasPalabras(palabrasCrucigrama.filter((p) => p.palabra.trim()));
      else preguntasFinales = preguntas;

      const res = await fetch("/api/challenges/custom", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(), descripcion: descripcion.trim(),
          tipo_juego: tipoJuego, tiempo_limite: parseInt(tiempoLimite),
          id_modulo: selectedModule.id, id_nivel: firstLevel.id,
          puntos_maximos: preguntasFinales.reduce((s, p) => s + p.puntos, 0),
          numero_preguntas: preguntasFinales.length,
          preguntas: preguntasFinales.map((p) => ({
            ...p, dificultad: "medio", opciones: p.opciones.filter((o) => o.trim()),
          })),
        }),
      });

      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Error al crear el reto"); }
      const data = await res.json();
      setRetoCreado({ id: data.id || data.reto?.id, nombre: nombre.trim() });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear el reto");
    } finally { setLoading(false); }
  };

  // Pantalla de exito
  if (retoCreado) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 space-y-6 page-enter">
        <div className="w-20 h-20 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-accent" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Reto creado con exito!</h2>
          <p className="text-muted-foreground mt-1">Comparte el link con tus estudiantes</p>
        </div>
        <div className="glass-card rounded-xl p-5 space-y-3 text-left">
          <div className="flex items-center gap-2 text-sm font-medium">
            <LinkIcon className="w-4 h-4 text-primary" />
            Link directo del reto
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted/30 border border-border/40 rounded-lg px-3 py-2 text-xs font-mono text-primary break-all">
              {linkReto}
            </code>
            <Button type="button" size="sm" onClick={copiarLink} className="gap-2 flex-shrink-0">
              {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiado ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Los estudiantes tambien pueden buscar el reto en la seccion <strong>Juegos</strong>.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>Ir al Dashboard</Button>
          <Button onClick={() => {
            setRetoCreado(null); setNombre(""); setDescripcion("");
            setPreguntas([{ texto: "", tipo: "multiple_choice", opciones: ["", "", "", ""], respuesta_correcta: "", explicacion: "", puntos: 10 }]);
            setPalabrasSopa([{ palabra: "", pista: "" }, { palabra: "", pista: "" }, { palabra: "", pista: "" }]);
            setPalabrasCrucigrama([{ palabra: "", pista: "" }, { palabra: "", pista: "" }, { palabra: "", pista: "" }]);
          }}>
            Crear Otro Reto
          </Button>
        </div>
      </div>
    );
  }

  const tipoInfo = TIPOS_JUEGO.find((t) => t.value === tipoJuego);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />Volver
        </Button>
        <div>
          <h1 className="text-xl font-bold">Crear Reto Personalizado</h1>
          <p className="text-muted-foreground text-sm">Diseña un reto con tus propias preguntas</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informacion general */}
        <div className="glass-card rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />Informacion del Reto
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Nombre del Reto</Label>
              <Input placeholder="ej. Quiz de Variables Python" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Descripcion</Label>
              <Textarea placeholder="Describe el objetivo del reto..." value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} className="resize-none" />
            </div>

            <div className="space-y-1.5">
              <Label>Dirigido a (Grado)</Label>
              <select
                value={modulo}
                onChange={(e) => setModulo(e.target.value)}
                className={selectCls}
              >
                <option value="1">1° de Bachillerato</option>
                <option value="2">2° de Bachillerato</option>
                <option value="3">3° de Bachillerato</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Tiempo Limite</Label>
              <select
                value={tiempoLimite}
                onChange={(e) => setTiempoLimite(e.target.value)}
                className={selectCls}
              >
                <option value="120">2 minutos</option>
                <option value="300">5 minutos</option>
                <option value="600">10 minutos</option>
                <option value="900">15 minutos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tipo de juego */}
        <div className="glass-card rounded-xl p-5 space-y-3">
          <h2 className="text-base font-semibold">Tipo de Juego</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TIPOS_JUEGO.map((tipo) => {
              const Icon = tipo.icon;
              const activo = tipoJuego === tipo.value;
              return (
                <button
                  key={tipo.value}
                  type="button"
                  onClick={() => { setTipoJuego(tipo.value); setError(""); }}
                  className={`flex flex-col items-start gap-1.5 p-3 rounded-xl border-2 transition-all text-left ${
                    activo ? "border-primary bg-primary/10" : "border-border/40 hover:border-border"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${activo ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-medium ${activo ? "text-primary" : ""}`}>{tipo.label}</span>
                  <span className="text-xs text-muted-foreground leading-tight">{tipo.descripcion}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quiz / Codigo / Seguridad / Carrera */}
        {esJuegoConPreguntas && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Preguntas ({preguntas.length})</h2>
              <Button type="button" variant="outline" size="sm" onClick={addPregunta} className="gap-2">
                <PlusCircle className="w-4 h-4" />Agregar Pregunta
              </Button>
            </div>

            {preguntas.map((pregunta, pIndex) => (
              <div key={pIndex} className="glass-card rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                      {pIndex + 1}
                    </div>
                    <span className="text-sm font-medium">Pregunta {pIndex + 1}</span>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removePregunta(pIndex)} disabled={preguntas.length <= 1} className="text-destructive hover:text-destructive h-7 w-7 p-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>{tipoJuego === "code_challenge" ? "Fragmento de Codigo / Pregunta" : "Texto de la Pregunta"}</Label>
                    <Textarea
                      placeholder={tipoJuego === "code_challenge" ? "def suma(a, b):\n    return ___" : "Escribe la pregunta..."}
                      value={pregunta.texto}
                      onChange={(e) => updatePregunta(pIndex, "texto", e.target.value)}
                      rows={tipoJuego === "code_challenge" ? 3 : 2}
                      className={`resize-none text-sm ${tipoJuego === "code_challenge" ? "font-mono" : ""}`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Puntos</Label>
                    <select
                      value={pregunta.puntos.toString()}
                      onChange={(e) => updatePregunta(pIndex, "puntos", parseInt(e.target.value))}
                      className={selectCls}
                    >
                      <option value="5">5 puntos</option>
                      <option value="10">10 puntos</option>
                      <option value="15">15 puntos</option>
                      <option value="20">20 puntos</option>
                    </select>
                  </div>
                </div>

                {pregunta.tipo !== "true_false" && (
                  <div className="space-y-2">
                    <Label>Opciones de Respuesta</Label>
                    {pregunta.opciones.map((opcion, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-muted/50 border border-border/50 flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                          {String.fromCharCode(65 + oIndex)}
                        </div>
                        <Input
                          placeholder={`Opcion ${String.fromCharCode(65 + oIndex)}`}
                          value={opcion}
                          onChange={(e) => updateOpcion(pIndex, oIndex, e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Respuesta Correcta</Label>
                  <Input
                    placeholder="Escribe exactamente como aparece en las opciones"
                    value={pregunta.respuesta_correcta}
                    onChange={(e) => updatePregunta(pIndex, "respuesta_correcta", e.target.value)}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Explicacion (opcional)</Label>
                  <Input
                    placeholder="Explica por que esta es la respuesta correcta..."
                    value={pregunta.explicacion}
                    onChange={(e) => updatePregunta(pIndex, "explicacion", e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sopa de Letras */}
        {esSopa && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Palabras para la Sopa ({palabrasSopa.length})</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Minimo 3 palabras. Sin espacios, solo letras.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addPalabraSopa} className="gap-2">
                <PlusCircle className="w-4 h-4" />Agregar
              </Button>
            </div>
            {palabrasSopa.map((item, i) => (
              <div key={i} className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">{i + 1}</div>
                  <span className="text-sm font-medium">Palabra {i + 1}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removePalabraSopa(i)} disabled={palabrasSopa.length <= 1} className="text-destructive hover:text-destructive h-7 w-7 p-0 ml-auto">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Palabra</Label>
                    <Input placeholder="ej. VARIABLE" value={item.palabra} onChange={(e) => updatePalabraSopa(i, "palabra", e.target.value.toUpperCase().replace(/\s/g, ""))} className="text-sm font-mono uppercase" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Pista (opcional)</Label>
                    <Input placeholder="ej. Almacena datos en programacion" value={item.pista} onChange={(e) => updatePalabraSopa(i, "pista", e.target.value)} className="text-sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Crucigrama */}
        {esCrucigrama && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Palabras del Crucigrama ({palabrasCrucigrama.length})</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Cada palabra necesita una pista. Minimo 3.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addPalabraCrucigrama} className="gap-2">
                <PlusCircle className="w-4 h-4" />Agregar
              </Button>
            </div>
            {palabrasCrucigrama.map((item, i) => (
              <div key={i} className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">{i + 1}</div>
                  <span className="text-sm font-medium">Entrada {i + 1}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removePalabraCrucigrama(i)} disabled={palabrasCrucigrama.length <= 1} className="text-destructive hover:text-destructive h-7 w-7 p-0 ml-auto">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Respuesta (la palabra)</Label>
                    <Input placeholder="ej. ALGORITMO" value={item.palabra} onChange={(e) => updatePalabraCrucigrama(i, "palabra", e.target.value.toUpperCase().replace(/\s/g, ""))} className="text-sm font-mono uppercase" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Pista</Label>
                    <Input placeholder="ej. Secuencia de pasos para resolver un problema" value={item.pista} onChange={(e) => updatePalabraCrucigrama(i, "pista", e.target.value)} className="text-sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pb-2">
          {tipoInfo && (
            <p className="text-xs text-muted-foreground mb-3 text-center">
              Tipo seleccionado: <strong>{tipoInfo.label}</strong> — {tipoInfo.descripcion}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full gap-2 neon-border" disabled={loading}>
            {loading
              ? <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <PlusCircle className="w-5 h-5" />}
            {loading ? "Creando Reto..." : "Publicar Reto"}
          </Button>
        </div>
      </form>
    </div>
  );
}
