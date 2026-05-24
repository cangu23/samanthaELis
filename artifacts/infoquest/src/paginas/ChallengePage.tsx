// Motor de juego: quiz, speed_race, code_challenge, security_puzzle, word_search, crossword, drag_drop
import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/contextos/AuthContext";
import { Button } from "@/componentes/interfaz/button";
import { Progress } from "@/componentes/interfaz/progress";
import { Badge } from "@/componentes/interfaz/badge";
import { RobotMascot } from "@/componentes/mascota/RobotMascot";
import WordSearchGame from "@/componentes/juegos/WordSearchGame";
import CrosswordGame from "@/componentes/juegos/CrosswordGame";
import DragDropGame from "@/componentes/juegos/DragDropGame";
import {
  Clock, CheckCircle2, XCircle, Trophy, Zap, ArrowLeft, Star, ChevronRight,
} from "lucide-react";
import { cn } from "@/utilidades/utils";

interface Reto {
  id: number;
  nombre: string;
  descripcion: string;
  tipo_juego: string;
  tiempo_limite: number;
  puntos_maximos: number;
  numero_preguntas: number;
  id_modulo: number;
  id_nivel: number;
}

interface Pregunta {
  id: number;
  tipo: string;
  texto: string;
  opciones: string[];
  dificultad: string;
  puntos: number;
}

type GameState = "loading" | "ready" | "playing" | "result";

export function ChallengePage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const token = localStorage.getItem("cerebrito_token");
  const headers = { Authorization: `Bearer ${token}` };

  const [reto, setReto] = useState<Reto | null>(null);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [gameState, setGameState] = useState<GameState>("loading");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; explanation: string } | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<
    { pregunta_id: number; respuesta: string; correcta: boolean; puntos: number }[]
  >([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Carga el reto y sus preguntas
  // IDs negativos = retos personalizados del docente; positivos = predefinidos
  useEffect(() => {
    if (!params.id) return;
    const rawId = Number(params.id);
    const isCustom = rawId < 0;
    const realId = Math.abs(rawId);

    if (isCustom) {
      // Reto personalizado: un solo fetch devuelve todo
      fetch(`/api/challenges/custom/${realId}`, { headers })
        .then((r) => r.json())
        .then((data) => {
          setReto({ ...data, id: rawId });
          setTimeLeft(data.tiempo_limite);
          setTotalTime(data.tiempo_limite);
          const qs = Array.isArray(data.preguntas) ? data.preguntas.map((p: { opciones?: string | string[]; [key: string]: unknown }) => ({
            ...p,
            opciones: typeof p.opciones === "string" ? JSON.parse(p.opciones) : (p.opciones || []),
          })) : [];
          setPreguntas(qs);
          setGameState("ready");
        })
        .catch(console.error);
    } else {
      fetch(`/api/challenges/${realId}`, { headers })
        .then((r) => r.json())
        .then((data) => {
          setReto(data);
          setTimeLeft(data.tiempo_limite);
          setTotalTime(data.tiempo_limite);
        })
        .catch(console.error);

      fetch(`/api/challenges/${realId}/questions`, { headers })
        .then((r) => r.json())
        .then((data) => {
          const qs = Array.isArray(data) ? data : data.questions || [];
          setPreguntas(qs);
          setGameState("ready");
        })
        .catch(console.error);
    }
  }, [params.id]);

  // Timer countdown
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  const startGame = () => {
    setGameState("playing");
    setCurrentIndex(0);
    setScore(0);
    setCorrectCount(0);
    setAnsweredQuestions([]);
    setSelectedOption(null);
    setFeedback(null);
    startTimer();
  };

  const handleTimeOut = () => {
    stopTimer();
    submitResult();
  };

  // Maneja la seleccion de una respuesta
  const handleAnswer = async (option: string) => {
    if (selectedOption !== null || !preguntas[currentIndex]) return;
    setSelectedOption(option);
    stopTimer();

    const pregunta = preguntas[currentIndex];
    const rawId = Number(params.id);
    const isCustom = rawId < 0;

    try {
      let correct: boolean;
      let explanation = "";
      let pointsEarned = 0;

      if (isCustom) {
        // Para retos personalizados, verificar localmente con la respuesta_correcta
        const preguntaConRespuesta = pregunta as Pregunta & { respuesta_correcta?: string; explicacion?: string };
        correct = (preguntaConRespuesta.respuesta_correcta ?? "").trim().toLowerCase() === option.trim().toLowerCase();
        explanation = preguntaConRespuesta.explicacion || "";
        pointsEarned = correct ? pregunta.puntos : 0;
      } else {
        // Para retos predefinidos, verificar en el servidor
        const res = await fetch(`/api/challenges/${rawId}/check-answer`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ pregunta_id: pregunta.id, respuesta: option }),
        });
        const data = await res.json();
        correct = data.correcta;
        explanation = data.explicacion || "";
        pointsEarned = correct ? pregunta.puntos : 0;
      }

      setFeedback({ correct, explanation });
      if (correct) {
        setScore((prev) => prev + pointsEarned);
        setCorrectCount((prev) => prev + 1);
      }

      setAnsweredQuestions((prev) => [
        ...prev,
        { pregunta_id: pregunta.id, respuesta: option, correcta: correct, puntos: pointsEarned },
      ]);
    } catch {
      // Si falla el check, asumimos incorrecta
      setFeedback({ correct: false, explanation: "Error al verificar la respuesta" });
      setAnsweredQuestions((prev) => [
        ...prev,
        { pregunta_id: pregunta.id, respuesta: option, correcta: false, puntos: 0 },
      ]);
    }
  };

  // Siguiente pregunta
  const handleNext = () => {
    setSelectedOption(null);
    setFeedback(null);
    const next = currentIndex + 1;
    if (next >= preguntas.length) {
      stopTimer();
      submitResult();
    } else {
      setCurrentIndex(next);
      startTimer();
    }
  };

  // Guarda el resultado en el servidor (acepta valores directos para evitar stale state)
  const submitResult = async (overrideScore?: number, overrideCorrect?: number, overrideTotal?: number) => {
    if (!reto) return;
    const finalScore = overrideScore ?? score;
    const finalCorrect = overrideCorrect ?? correctCount;
    const finalTotal = overrideTotal ?? preguntas.length;
    try {
      await fetch(`/api/results`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          id_reto: reto.id,
          puntaje: finalScore,
          respuestas_correctas: finalCorrect,
          total_preguntas: finalTotal || 1,
          tiempo_empleado: totalTime - timeLeft,
          completado: true,
          respuestas: answeredQuestions,
        }),
      });
    } catch (err) {
      console.error("Error guardando resultado:", err);
    }
    setScore(finalScore);
    setCorrectCount(finalCorrect);
    setGameState("result");
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const tipoColors: Record<string, string> = {
    quiz: "#0EA5E9",
    code_challenge: "#A855F7",
    security_puzzle: "#22C55E",
    drag_drop: "#F59E0B",
    speed_race: "#EF4444",
    word_search: "#06B6D4",
    crossword: "#8B5CF6",
  };

  if (gameState === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Cargando reto...</p>
      </div>
    );
  }

  // Pantalla de inicio del reto
  if (gameState === "ready" && reto) {
    const color = tipoColors[reto.tipo_juego] || "#0EA5E9";
    return (
      <div className="max-w-xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1 as any)} className="mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>

        <div className="glass-card rounded-2xl p-8 text-center space-y-6 page-enter">
          <RobotMascot size="md" mood="excited" className="mx-auto" />

          <div>
            <Badge
              className="mb-3 text-sm px-3 py-1"
              style={{ backgroundColor: `${color}20`, color, borderColor: `${color}40` }}
            >
              {(reto.tipo_juego ?? "").replace(/_/g, " ").toUpperCase()}
            </Badge>
            <h1 className="text-2xl font-bold font-orbitron">{reto.nombre}</h1>
            <p className="text-muted-foreground mt-2">{reto.descripcion}</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Zap, label: "Preguntas", value: preguntas.length },
              { icon: Clock, label: "Tiempo", value: formatTime(reto.tiempo_limite) },
              { icon: Star, label: "Max Puntos", value: reto.puntos_maximos },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="p-3 rounded-xl bg-muted/30 border border-border/50">
                <Icon className="w-4 h-4 mx-auto mb-1 text-primary" />
                <div className="text-lg font-bold" style={{ color }}>{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>

          <Button onClick={startGame} size="lg" className="w-full gap-2 neon-border">
            <Zap className="w-5 h-5" />
            ¡Comenzar Reto!
          </Button>
        </div>
      </div>
    );
  }

  // Pantalla de resultado final
  if (gameState === "result" && reto) {
    const accuracy = preguntas.length > 0 ? Math.round((correctCount / preguntas.length) * 100) : 0;
    const mood = accuracy >= 80 ? "excited" : accuracy >= 50 ? "happy" : "wrong";
    const scorePercent = Math.round((score / reto.puntos_maximos) * 100);

    return (
      <div className="max-w-xl mx-auto">
        <div className="glass-card rounded-2xl p-8 text-center space-y-6 page-enter">
          <RobotMascot size="md" mood={mood} className="mx-auto" />

          <div>
            <h1 className="text-2xl font-bold font-orbitron">
              {accuracy >= 80 ? "¡Excelente!" : accuracy >= 50 ? "¡Bien hecho!" : "Sigue intentando"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Has completado: {reto.nombre}</p>
          </div>

          {/* Score grande */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-primary/15 to-primary/5 border border-primary/30">
            <div className="text-5xl font-bold font-orbitron text-primary">{score}</div>
            <div className="text-sm text-muted-foreground mt-1">puntos obtenidos</div>
            <Progress value={scorePercent} className="mt-3 h-2" />
            <div className="text-xs text-muted-foreground mt-1">{scorePercent}% del maximo</div>
          </div>

          {/* Estadisticas */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: CheckCircle2, label: "Correctas", value: correctCount, color: "#22C55E" },
              { icon: XCircle, label: "Incorrectas", value: preguntas.length - correctCount, color: "#EF4444" },
              { icon: Zap, label: "Precision", value: `${accuracy}%`, color: "#0EA5E9" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="p-3 rounded-xl bg-muted/30 border border-border/50">
                <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
                <div className="text-lg font-bold" style={{ color }}>{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/dashboard")} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button onClick={() => navigate("/ranking")} className="flex-1 gap-2">
              <Trophy className="w-4 h-4" />
              Ver Ranking
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Juego de sopa de letras
  if (gameState === "playing" && reto?.tipo_juego === "word_search") {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold font-orbitron text-[#06B6D4]">{reto.nombre}</h2>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-[#06B6D4]/10 border-[#06B6D4]/30 text-[#06B6D4] text-sm font-mono font-bold">
            <Clock className="w-3.5 h-3.5" />{formatTime(timeLeft)}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <WordSearchGame
            challengeName={reto.nombre}
            onFinish={(pts, found, total) => {
              stopTimer();
              submitResult(pts, found, total);
            }}
          />
        </div>
      </div>
    );
  }

  // Juego de crucigrama
  if (gameState === "playing" && reto?.tipo_juego === "crossword") {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold font-orbitron text-[#8B5CF6]">{reto.nombre}</h2>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-[#8B5CF6]/10 border-[#8B5CF6]/30 text-[#8B5CF6] text-sm font-mono font-bold">
            <Clock className="w-3.5 h-3.5" />{formatTime(timeLeft)}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <CrosswordGame
            challengeName={reto.nombre}
            onFinish={(pts, correct, total) => {
              stopTimer();
              submitResult(pts, correct, total);
            }}
          />
        </div>
      </div>
    );
  }

  // Juego de ordenar código (drag & drop)
  if (gameState === "playing" && reto?.tipo_juego === "drag_drop") {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold font-orbitron text-[#F59E0B]">{reto.nombre}</h2>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B] text-sm font-mono font-bold">
            <Clock className="w-3.5 h-3.5" />{formatTime(timeLeft)}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <DragDropGame
            challengeName={reto.nombre}
            onFinish={(pts, correct, total) => {
              stopTimer();
              submitResult(pts, correct, total);
            }}
          />
        </div>
      </div>
    );
  }

  // Pantalla de juego activo (quiz, speed_race, code_challenge, etc.)
  if (gameState === "playing" && preguntas[currentIndex] && reto) {
    const pregunta = preguntas[currentIndex];
    const progress = ((currentIndex + 1) / preguntas.length) * 100;
    const timePercent = (timeLeft / totalTime) * 100;
    const isSpeedRace = reto.tipo_juego === "speed_race";

    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header del juego */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Pregunta {currentIndex + 1} de {preguntas.length}</span>
              <span className="font-bold text-primary">{score} pts</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Timer */}
          <div
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-mono font-bold transition-colors",
              timeLeft <= 10
                ? "bg-destructive/20 border-destructive/50 text-destructive"
                : timeLeft <= 30
                  ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-400"
                  : "bg-primary/10 border-primary/30 text-primary"
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Pregunta */}
        <div key={currentIndex} className="glass-card rounded-2xl p-6">
          <div className="flex items-start gap-2 mb-5">
            <Badge variant="outline" className="text-xs flex-shrink-0 mt-0.5">
              {pregunta.tipo === "true_false" ? "Verdadero/Falso" :
               pregunta.tipo === "code_completion" ? "Completar Codigo" : "Opcion Multiple"}
            </Badge>
            <p className={cn(
              "font-medium leading-relaxed",
              pregunta.tipo === "code_completion" ? "font-mono-code text-sm bg-muted/30 p-3 rounded-lg w-full" : "text-base"
            )}>
              {pregunta.texto}
            </p>
          </div>

          {/* Opciones de respuesta */}
          <div className={cn(
            "grid gap-3",
            pregunta.opciones.length === 2 ? "grid-cols-2" : "grid-cols-1"
          )}>
            {pregunta.opciones.map((opcion) => {
              const isSelected = selectedOption === opcion;
              const isCorrect = feedback?.correct && isSelected;
              const isWrong = !feedback?.correct && isSelected;

              return (
                <button
                  key={opcion}
                  onClick={() => handleAnswer(opcion)}
                  disabled={selectedOption !== null}
                  className={cn(
                    "p-3 rounded-xl border text-sm font-medium text-left transition-all duration-200",
                    selectedOption === null
                      ? "bg-muted/30 border-border/60 hover:bg-primary/10 hover:border-primary/40 hover:scale-[1.02] cursor-pointer"
                      : isCorrect
                        ? "bg-accent/20 border-accent/60 text-accent"
                        : isWrong
                          ? "bg-destructive/20 border-destructive/60 text-destructive"
                          : "bg-muted/20 border-border/40 opacity-50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isCorrect && <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />}
                    {isWrong && <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />}
                    <span className={pregunta.tipo === "code_completion" ? "font-mono-code" : ""}>
                      {opcion}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Retroalimentacion despues de responder */}
          {feedback && (
            <div
              className={cn(
                "mt-4 p-3 rounded-xl text-sm border",
                feedback.correct
                  ? "bg-accent/10 border-accent/30 text-accent"
                  : "bg-destructive/10 border-destructive/30 text-destructive"
              )}
            >
              <div className="flex items-center gap-2 font-semibold mb-1">
                {feedback.correct ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    ¡Correcto! +{pregunta.puntos} puntos
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Incorrecto
                  </>
                )}
              </div>
              {feedback.explanation && (
                <p className="text-xs opacity-80">{feedback.explanation}</p>
              )}
            </div>
          )}
        </div>

        {/* Boton siguiente */}
        {feedback && (
          <Button onClick={handleNext} className="w-full gap-2">
            {currentIndex + 1 >= preguntas.length ? (
              <>
                <Trophy className="w-4 h-4" />
                Ver Resultado
              </>
            ) : (
              <>
                Siguiente Pregunta
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  return null;
}
