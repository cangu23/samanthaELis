// Pagina para que los docentes creen retos personalizados
import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  PlusCircle,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Zap,
} from "lucide-react";

interface Pregunta {
  texto: string;
  tipo: "multiple_choice" | "true_false" | "code_completion";
  opciones: string[];
  respuesta_correcta: string;
  explicacion: string;
  puntos: number;
}

export function CreateChallengePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const token = localStorage.getItem("cerebrito_token");
  const headers = { Authorization: `Bearer ${token}` };

  // Datos del reto
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipoJuego, setTipoJuego] = useState("quiz");
  const [tiempoLimite, setTiempoLimite] = useState("300");
  const [modulo, setModulo] = useState("1");

  // Preguntas del reto personalizado
  const [preguntas, setPreguntas] = useState<Pregunta[]>([
    {
      texto: "",
      tipo: "multiple_choice",
      opciones: ["", "", "", ""],
      respuesta_correcta: "",
      explicacion: "",
      puntos: 10,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Solo docentes pueden acceder
  if (user?.rol !== "docente") {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <AlertCircle className="w-10 h-10 mx-auto mb-3" />
        <p>Solo los docentes pueden crear retos personalizados</p>
      </div>
    );
  }

  const addPregunta = () => {
    setPreguntas([
      ...preguntas,
      {
        texto: "",
        tipo: "multiple_choice",
        opciones: ["", "", "", ""],
        respuesta_correcta: "",
        explicacion: "",
        puntos: 10,
      },
    ]);
  };

  const removePregunta = (index: number) => {
    if (preguntas.length <= 1) return;
    setPreguntas(preguntas.filter((_, i) => i !== index));
  };

  const updatePregunta = (index: number, field: keyof Pregunta, value: string | number | string[]) => {
    const updated = [...preguntas];
    (updated[index] as unknown as Record<string, unknown>)[field] = value;
    // Al cambiar tipo, resetea opciones
    if (field === "tipo") {
      if (value === "true_false") {
        updated[index].opciones = ["Verdadero", "Falso"];
      } else if (value === "multiple_choice") {
        updated[index].opciones = ["", "", "", ""];
      } else {
        updated[index].opciones = ["", ""];
      }
      updated[index].respuesta_correcta = "";
    }
    setPreguntas(updated);
  };

  const updateOpcion = (pregIndex: number, opIndex: number, value: string) => {
    const updated = [...preguntas];
    updated[pregIndex].opciones[opIndex] = value;
    setPreguntas(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim() || !descripcion.trim()) {
      setError("Completa el nombre y descripcion del reto");
      return;
    }

    for (let i = 0; i < preguntas.length; i++) {
      const p = preguntas[i];
      if (!p.texto.trim()) {
        setError(`La pregunta ${i + 1} no tiene texto`);
        return;
      }
      if (!p.respuesta_correcta.trim()) {
        setError(`La pregunta ${i + 1} no tiene respuesta correcta`);
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      // Obtener el id_modulo e id_nivel del grado seleccionado
      const modulosRes = await fetch(`/api/modules?anio=${modulo}`, { headers });
      const modulosData = await modulosRes.json();
      const selectedModule = Array.isArray(modulosData) ? modulosData[0] : null;

      if (!selectedModule) {
        setError("No se encontro el modulo para ese grado");
        setLoading(false);
        return;
      }

      const nivelesRes = await fetch(`/api/modules/${selectedModule.id}/levels`, { headers });
      const nivelesData = await nivelesRes.json();
      const firstLevel = Array.isArray(nivelesData) ? nivelesData[0] : null;

      if (!firstLevel) {
        setError("No se encontraron niveles para ese modulo");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/challenges/custom", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          tipo_juego: tipoJuego,
          tiempo_limite: parseInt(tiempoLimite),
          id_modulo: selectedModule.id,
          id_nivel: firstLevel.id,
          puntos_maximos: preguntas.reduce((s, p) => s + p.puntos, 0),
          numero_preguntas: preguntas.length,
          preguntas: preguntas.map((p) => ({
            ...p,
            dificultad: "medio",
            opciones: p.opciones.filter((o) => o.trim()),
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al crear el reto");
      }

      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear el reto");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl mx-auto text-center py-20"
      >
        <CheckCircle2 className="w-16 h-16 text-accent mx-auto mb-4" />
        <h2 className="text-2xl font-bold">¡Reto creado con exito!</h2>
        <p className="text-muted-foreground mt-2">Redirigiendo al dashboard...</p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Volver
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
        {/* Datos generales del reto */}
        <div className="glass-card rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Informacion del Reto
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Nombre del Reto</Label>
              <Input
                placeholder="ej. Quiz de Variables Python"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Descripcion</Label>
              <Textarea
                placeholder="Describe el objetivo del reto..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Tipo de Juego</Label>
              <Select value={tipoJuego} onValueChange={setTipoJuego}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="code_challenge">Desafio de Codigo</SelectItem>
                  <SelectItem value="security_puzzle">Puzzle de Seguridad</SelectItem>
                  <SelectItem value="speed_race">Carrera Rapida</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Dirigido a (Grado)</Label>
              <Select value={modulo} onValueChange={setModulo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1° de Bachillerato</SelectItem>
                  <SelectItem value="2">2° de Bachillerato</SelectItem>
                  <SelectItem value="3">3° de Bachillerato</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Tiempo Limite (segundos)</Label>
              <Select value={tiempoLimite} onValueChange={setTiempoLimite}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="120">2 minutos</SelectItem>
                  <SelectItem value="300">5 minutos</SelectItem>
                  <SelectItem value="600">10 minutos</SelectItem>
                  <SelectItem value="900">15 minutos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Preguntas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Preguntas ({preguntas.length})</h2>
            <Button type="button" variant="outline" size="sm" onClick={addPregunta} className="gap-2">
              <PlusCircle className="w-4 h-4" />
              Agregar Pregunta
            </Button>
          </div>

          {preguntas.map((pregunta, pIndex) => (
            <motion.div
              key={pIndex}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                    {pIndex + 1}
                  </div>
                  <span className="text-sm font-medium">Pregunta {pIndex + 1}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePregunta(pIndex)}
                  disabled={preguntas.length <= 1}
                  className="text-destructive hover:text-destructive h-7 w-7 p-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Texto de la Pregunta</Label>
                  <Textarea
                    placeholder="Escribe la pregunta..."
                    value={pregunta.texto}
                    onChange={(e) => updatePregunta(pIndex, "texto", e.target.value)}
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Tipo de Pregunta</Label>
                  <Select
                    value={pregunta.tipo}
                    onValueChange={(v) => updatePregunta(pIndex, "tipo", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">Opcion Multiple</SelectItem>
                      <SelectItem value="true_false">Verdadero / Falso</SelectItem>
                      <SelectItem value="code_completion">Completar Codigo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Puntos</Label>
                  <Select
                    value={pregunta.puntos.toString()}
                    onValueChange={(v) => updatePregunta(pIndex, "puntos", parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 puntos</SelectItem>
                      <SelectItem value="10">10 puntos</SelectItem>
                      <SelectItem value="15">15 puntos</SelectItem>
                      <SelectItem value="20">20 puntos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Opciones */}
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
                      disabled={pregunta.tipo === "true_false"}
                    />
                  </div>
                ))}
              </div>

              {/* Respuesta correcta */}
              <div className="space-y-1.5">
                <Label>Respuesta Correcta</Label>
                {pregunta.tipo === "true_false" ? (
                  <Select
                    value={pregunta.respuesta_correcta}
                    onValueChange={(v) => updatePregunta(pIndex, "respuesta_correcta", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la respuesta correcta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Verdadero">Verdadero</SelectItem>
                      <SelectItem value="Falso">Falso</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="Escribe exactamente como aparece en las opciones"
                    value={pregunta.respuesta_correcta}
                    onChange={(e) => updatePregunta(pIndex, "respuesta_correcta", e.target.value)}
                    className="text-sm"
                  />
                )}
              </div>

              {/* Explicacion */}
              <div className="space-y-1.5">
                <Label>Explicacion (opcional)</Label>
                <Input
                  placeholder="Explica por que esta es la respuesta correcta..."
                  value={pregunta.explicacion}
                  onChange={(e) => updatePregunta(pIndex, "explicacion", e.target.value)}
                  className="text-sm"
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Boton enviar */}
        <Button type="submit" size="lg" className="w-full gap-2 neon-border" disabled={loading}>
          {loading ? (
            <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <PlusCircle className="w-5 h-5" />
          )}
          {loading ? "Creando Reto..." : "Publicar Reto"}
        </Button>
      </form>
    </div>
  );
}
