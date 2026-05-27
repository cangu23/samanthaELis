// Juego de ordenar código: arrastra las líneas para ponerlas en el orden correcto
import { useState, useRef } from "react";
import { CheckCircle2, XCircle, GripVertical, Play, RotateCcw } from "lucide-react";
import { Button } from "@/componentes/interfaz/button";
import { Badge } from "@/componentes/interfaz/badge";

interface DragDropGameProps {
  challengeName: string;
  onFinish: (pts: number, correct: number, total: number) => void;
}

interface CodePuzzle {
  title: string;
  language: string;
  lines: string[];
  explanation: string;
}

const PUZZLES: CodePuzzle[] = [
  {
    title: "Función que suma dos números",
    language: "Python",
    explanation: "Primero se define la función, luego el return, y finalmente se llama.",
    lines: [
      "def sumar(a, b):",
      "    return a + b",
      "resultado = sumar(3, 5)",
      "print(resultado)",
    ],
  },
  {
    title: "Ciclo for con lista",
    language: "Python",
    explanation: "Se crea la lista, se itera con for, y se imprime cada elemento.",
    lines: [
      "numeros = [1, 2, 3, 4, 5]",
      "for num in numeros:",
      "    cuadrado = num * num",
      "    print(cuadrado)",
    ],
  },
  {
    title: "Clase básica",
    language: "Python",
    explanation: "Se define la clase, el constructor, el atributo y el método.",
    lines: [
      "class Estudiante:",
      "    def __init__(self, nombre):",
      "        self.nombre = nombre",
      "    def saludar(self):",
      '        print("Hola, soy", self.nombre)',
    ],
  },
  {
    title: "Condicional simple",
    language: "Python",
    explanation: "Se lee el valor, se evalúa la condición y se muestra el resultado.",
    lines: [
      "nota = int(input('Ingresa tu nota: '))",
      "if nota >= 7:",
      '    print("Aprobado")',
      "else:",
      '    print("Reprobado")',
    ],
  },
  {
    title: "Búsqueda en lista",
    language: "Python",
    explanation: "Se itera la lista buscando el elemento hasta encontrarlo.",
    lines: [
      "lista = [10, 20, 30, 40, 50]",
      "buscar = 30",
      "for i, val in enumerate(lista):",
      "    if val == buscar:",
      "        print('Encontrado en posicion', i)",
    ],
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function DragDropGame({ challengeName: _challengeName, onFinish }: DragDropGameProps) {
  const puzzleSet = useRef(shuffle(PUZZLES).slice(0, 3));
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [lines, setLines] = useState<string[]>(() => shuffle(puzzleSet.current[0].lines));
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const puzzle = puzzleSet.current[puzzleIdx];
  const isLast = puzzleIdx === puzzleSet.current.length - 1;

  const onDragStart = (i: number) => setDragIdx(i);
  const onDragEnter = (i: number) => setOverIdx(i);
  const onDragEnd = () => {
    if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
      const next = [...lines];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(overIdx, 0, moved);
      setLines(next);
    }
    setDragIdx(null);
    setOverIdx(null);
  };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  const verificar = () => {
    const correct = puzzle.lines.every((line, i) => lines[i] === line);
    const pts = correct ? Math.round(500 / puzzleSet.current.length) : 0;
    setResults((prev) => [...prev, correct]);
    setTotalScore((s) => s + pts);
    if (correct) setTotalCorrect((c) => c + 1);
    setChecked(true);
  };

  const siguiente = () => {
    if (isLast) {
      onFinish(totalScore, totalCorrect, puzzleSet.current.length);
      return;
    }
    const next = puzzleIdx + 1;
    setPuzzleIdx(next);
    setLines(shuffle(puzzleSet.current[next].lines));
    setChecked(false);
  };

  const reintentar = () => {
    setLines(shuffle(puzzle.lines));
    setChecked(false);
    setResults((prev) => prev.slice(0, -1));
    if (results[results.length - 1]) setTotalCorrect((c) => c - 1);
  };

  const isCorrect = checked && puzzle.lines.every((line, i) => lines[i] === line);

  return (
    <div className="space-y-4">
      {/* Progreso */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Puzzle {puzzleIdx + 1} de {puzzleSet.current.length}</span>
        <div className="flex gap-1">
          {puzzleSet.current.map((_, i) => (
            <span key={i} className={`w-2 h-2 rounded-full ${i < puzzleIdx ? "bg-green-400" : i === puzzleIdx ? "bg-primary" : "bg-muted/40"}`} />
          ))}
        </div>
      </div>

      {/* Título del puzzle */}
      <div>
        <Badge className="mb-2 text-xs bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30">
          {puzzle.language}
        </Badge>
        <p className="font-semibold text-sm">{puzzle.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Arrastra las líneas para ordenarlas correctamente
        </p>
      </div>

      {/* Área de drag-drop */}
      <div className="space-y-1.5 select-none">
        {lines.map((line, i) => {
          const correctAtPos = checked && puzzle.lines[i] === line;
          const wrongAtPos = checked && puzzle.lines[i] !== line;
          return (
            <div
              key={i}
              draggable={!checked}
              onDragStart={() => onDragStart(i)}
              onDragEnter={() => onDragEnter(i)}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              className={`
                flex items-center gap-2 px-3 py-2.5 rounded-lg border font-mono text-sm cursor-grab active:cursor-grabbing
                transition-all
                ${overIdx === i && dragIdx !== i ? "border-primary/60 bg-primary/10 scale-[1.01]" : ""}
                ${checked
                  ? correctAtPos
                    ? "border-green-500/50 bg-green-500/10 text-green-300"
                    : wrongAtPos
                      ? "border-red-500/40 bg-red-500/10 text-red-300"
                      : "border-border/50 bg-white/5"
                  : "border-border/50 bg-white/5 hover:border-primary/40"}
              `}
            >
              {!checked && <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              {checked && (correctAtPos
                ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
              <span className="text-xs text-muted-foreground mr-1 w-4 text-right">{i + 1}.</span>
              <code className="flex-1 whitespace-pre">{line}</code>
            </div>
          );
        })}
      </div>

      {/* Explicación cuando está verificado */}
      {checked && (
        <div className={`p-3 rounded-lg text-sm page-enter ${isCorrect ? "bg-green-500/10 border border-green-500/30 text-green-300" : "bg-red-500/10 border border-red-500/30 text-red-300"}`}>
          {isCorrect ? "Orden correcto. " : "Orden incorrecto. "}
          <span className="text-muted-foreground">{puzzle.explanation}</span>
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-2">
        {!checked ? (
          <Button onClick={verificar} className="flex-1 gap-2">
            <Play className="w-4 h-4" />Verificar orden
          </Button>
        ) : (
          <>
            {!isCorrect && (
              <Button variant="outline" onClick={reintentar} className="gap-2">
                <RotateCcw className="w-4 h-4" />Reintentar
              </Button>
            )}
            <Button onClick={siguiente} className="flex-1">
              {isLast ? "Ver resultados →" : "Siguiente puzzle →"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
