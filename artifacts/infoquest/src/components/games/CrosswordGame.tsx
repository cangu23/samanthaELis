// Crucigrama interactivo — el usuario completa palabras con pistas
// Diseño compacto con pistas horizontales y verticales
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface Clue {
  num: number;
  dir: "H" | "V";
  row: number;
  col: number;
  answer: string;
  clue: string;
}

interface CrosswordData {
  size: number;
  clues: Clue[];
  blocked: [number, number][];
}

const CROSSWORDS: Record<string, CrosswordData> = {
  algoritmos: {
    size: 8,
    clues: [
      { num: 1, dir: "H", row: 0, col: 0, answer: "BUCLE",   clue: "Estructura que repite instrucciones" },
      { num: 2, dir: "V", row: 0, col: 4, answer: "LISTA",   clue: "Coleccion ordenada de elementos" },
      { num: 3, dir: "H", row: 2, col: 1, answer: "ARRAY",   clue: "Arreglo de datos del mismo tipo" },
      { num: 4, dir: "V", row: 1, col: 0, answer: "BOOLE",   clue: "Tipo de dato verdadero/falso" },
      { num: 5, dir: "H", row: 4, col: 2, answer: "ORDEN",   clue: "Proceso de organizar datos" },
      { num: 6, dir: "V", row: 3, col: 6, answer: "NODO",    clue: "Elemento de una lista enlazada" },
    ],
    blocked: [[1,4],[3,0],[5,1],[0,6],[6,2],[7,6]],
  },
  seguridad: {
    size: 8,
    clues: [
      { num: 1, dir: "H", row: 0, col: 0, answer: "CLAVE",   clue: "Contrasena de acceso al sistema" },
      { num: 2, dir: "V", row: 0, col: 3, answer: "VIRUS",   clue: "Software malicioso que se replica" },
      { num: 3, dir: "H", row: 2, col: 1, answer: "TOKEN",   clue: "Codigo de autenticacion temporal" },
      { num: 4, dir: "V", row: 1, col: 0, answer: "CIFRAR",  clue: "Proteger datos con encriptacion" },
      { num: 5, dir: "H", row: 4, col: 0, answer: "HACK",    clue: "Acceso no autorizado a sistemas" },
      { num: 6, dir: "V", row: 3, col: 5, answer: "SSL",     clue: "Protocolo de capa segura" },
    ],
    blocked: [[1,3],[3,1],[5,0],[0,5],[6,1],[7,5]],
  },
};

function getCrossword(name: string): CrosswordData {
  const lower = name.toLowerCase();
  if (lower.includes("seguridad") || lower.includes("security")) return CROSSWORDS.seguridad;
  return CROSSWORDS.algoritmos;
}

interface Props {
  challengeName: string;
  onFinish: (score: number, correct: number, total: number) => void;
}

export default function CrosswordGame({ challengeName, onFinish }: Props) {
  const cw = getCrossword(challengeName);
  const { size, clues, blocked } = cw;

  // Build grid cells from clues
  const emptyGrid = Array.from({ length: size }, () => Array(size).fill(""));
  const [grid, setGrid] = useState<string[][]>(emptyGrid);
  const [selectedClue, setSelectedClue] = useState<Clue | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctClues, setCorrectClues] = useState<Set<number>>(new Set());

  const isBlocked = (r: number, c: number) =>
    blocked.some(([br, bc]) => br === r && bc === c);

  const isActive = (r: number, c: number) => {
    if (!selectedClue) return false;
    const { row, col, dir, answer } = selectedClue;
    for (let i = 0; i < answer.length; i++) {
      const cr = dir === "H" ? row : row + i;
      const cc = dir === "H" ? col + i : col;
      if (cr === r && cc === c) return true;
    }
    return false;
  };

  const getCellClueNum = (r: number, c: number) =>
    clues.find((cl) => cl.row === r && cl.col === c)?.num;

  function handleInput(r: number, c: number, val: string) {
    const letter = val.toUpperCase().slice(-1);
    const newGrid = grid.map((row) => [...row]);
    newGrid[r][c] = letter;
    setGrid(newGrid);
    // Auto-advance within selected clue
    if (selectedClue) {
      const { row, col, dir, answer } = selectedClue;
      for (let i = 0; i < answer.length - 1; i++) {
        const cr = dir === "H" ? row : row + i;
        const cc = dir === "H" ? col + i : col;
        if (cr === r && cc === c) {
          const nr = dir === "H" ? row : row + i + 1;
          const nc = dir === "H" ? col + i + 1 : col;
          const nextEl = document.getElementById(`cell-${nr}-${nc}`);
          nextEl?.focus();
          break;
        }
      }
    }
  }

  function checkAnswers() {
    const correct = new Set<number>();
    clues.forEach((cl) => {
      let word = "";
      for (let i = 0; i < cl.answer.length; i++) {
        const r = cl.dir === "H" ? cl.row : cl.row + i;
        const c = cl.dir === "H" ? cl.col + i : cl.col;
        word += grid[r]?.[c] || "";
      }
      if (word === cl.answer) correct.add(cl.num);
    });
    setCorrectClues(correct);
    setChecked(true);
    const score = Math.round((correct.size / clues.length) * 150);
    onFinish(score, correct.size, clues.length);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        {/* Grid */}
        <div className="flex-shrink-0">
          {Array.from({ length: size }, (_, r) => (
            <div key={r} className="flex">
              {Array.from({ length: size }, (_, c) => {
                const num = getCellClueNum(r, c);
                if (isBlocked(r, c)) {
                  return <div key={c} className="w-9 h-9 bg-[#0a0f1a] border border-[#0a0f1a]" />;
                }
                const active = isActive(r, c);
                const isCorrectCell = checked && clues.some((cl) => {
                  if (!correctClues.has(cl.num)) return false;
                  for (let i = 0; i < cl.answer.length; i++) {
                    const cr = cl.dir === "H" ? cl.row : cl.row + i;
                    const cc = cl.dir === "H" ? cl.col + i : cl.col;
                    if (cr === r && cc === c) return true;
                  }
                  return false;
                });
                return (
                  <div key={c} className="relative">
                    {num && (
                      <span className="absolute top-0 left-0.5 text-[8px] text-[#0EA5E9] font-bold z-10 leading-none">
                        {num}
                      </span>
                    )}
                    <input
                      id={`cell-${r}-${c}`}
                      type="text"
                      maxLength={1}
                      value={grid[r][c]}
                      onChange={(e) => handleInput(r, c, e.target.value)}
                      onFocus={() => {
                        const cl = clues.find((cl) => {
                          for (let i = 0; i < cl.answer.length; i++) {
                            const cr = cl.dir === "H" ? cl.row : cl.row + i;
                            const cc = cl.dir === "H" ? cl.col + i : cl.col;
                            if (cr === r && cc === c) return true;
                          }
                          return false;
                        });
                        if (cl) setSelectedClue(cl);
                      }}
                      className={cn(
                        "w-9 h-9 text-center text-sm font-bold font-mono uppercase border bg-white/5 focus:outline-none transition-all",
                        active ? "bg-[#0EA5E9]/20 border-[#0EA5E9]" : "border-white/20",
                        checked && isCorrectCell ? "bg-[#22C55E]/20 border-[#22C55E] text-[#22C55E]" :
                        checked && grid[r][c] ? "bg-red-500/20 border-red-500 text-red-400" : "text-white"
                      )}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Pistas */}
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <p className="text-xs font-bold text-[#0EA5E9] mb-1">→ HORIZONTAL</p>
            {clues.filter((c) => c.dir === "H").map((cl) => (
              <button
                key={cl.num}
                onClick={() => setSelectedClue(cl)}
                className={cn(
                  "w-full text-left text-xs p-1.5 rounded mb-1 transition-all",
                  selectedClue?.num === cl.num && selectedClue.dir === cl.dir
                    ? "bg-[#0EA5E9]/20 text-white"
                    : "text-muted-foreground hover:text-white",
                  checked && correctClues.has(cl.num) ? "text-[#22C55E]" : ""
                )}
              >
                <span className="font-bold mr-1">{cl.num}.</span>
                {cl.clue}
                {checked && correctClues.has(cl.num) && <CheckCircle2 className="w-3 h-3 inline ml-1 text-[#22C55E]" />}
              </button>
            ))}
          </div>
          <div>
            <p className="text-xs font-bold text-[#A855F7] mb-1">↓ VERTICAL</p>
            {clues.filter((c) => c.dir === "V").map((cl) => (
              <button
                key={cl.num}
                onClick={() => setSelectedClue(cl)}
                className={cn(
                  "w-full text-left text-xs p-1.5 rounded mb-1 transition-all",
                  selectedClue?.num === cl.num && selectedClue.dir === cl.dir
                    ? "bg-[#A855F7]/20 text-white"
                    : "text-muted-foreground hover:text-white",
                  checked && correctClues.has(cl.num) ? "text-[#22C55E]" : ""
                )}
              >
                <span className="font-bold mr-1">{cl.num}.</span>
                {cl.clue}
                {checked && correctClues.has(cl.num) && <CheckCircle2 className="w-3 h-3 inline ml-1 text-[#22C55E]" />}
              </button>
            ))}
          </div>
          {!checked && (
            <Button onClick={checkAnswers} className="w-full bg-[#0EA5E9] hover:bg-[#0EA5E9]/80 gap-2 mt-2">
              <CheckCircle2 className="w-4 h-4" />
              Verificar
            </Button>
          )}
          {checked && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30">
              <Trophy className="w-6 h-6 text-[#22C55E] mx-auto mb-1" />
              <p className="text-sm font-bold text-white">{correctClues.size}/{clues.length} correctas</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
