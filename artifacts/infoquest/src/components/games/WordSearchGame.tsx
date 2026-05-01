// Sopa de letras interactiva - el usuario busca palabras en la grilla
// Soporta seleccion con click-drag en horizontal, vertical y diagonal
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WORDSETS: Record<string, { words: string[]; grid: string[][] }> = {
  python: {
    words: ["PYTHON", "BUCLE", "LISTA", "CLASE", "FUNCION", "MODULO", "VARIABLE", "BOOL"],
    grid: [
      ["P","Y","T","H","O","N","X","L","Q","W"],
      ["C","L","A","S","E","M","F","I","A","B"],
      ["B","U","C","L","E","O","U","S","S","O"],
      ["V","G","T","A","R","D","N","T","D","O"],
      ["A","L","I","S","T","A","C","A","F","L"],
      ["R","X","P","K","R","J","I","I","G","K"],
      ["I","M","O","D","U","L","O","D","H","J"],
      ["A","E","Q","W","Y","B","N","K","J","L"],
      ["B","F","L","Z","N","O","X","P","V","M"],
      ["L","V","A","R","I","A","B","L","E","N"],
    ],
  },
  redes: {
    words: ["RED", "ROUTER", "SWITCH", "LAN", "WAN", "IP", "DNS", "HTTP", "CABLE", "NODO"],
    grid: [
      ["R","O","U","T","E","R","X","C","Q","W"],
      ["E","L","A","S","E","M","F","A","D","B"],
      ["D","U","C","L","E","O","U","B","N","N"],
      ["W","A","N","A","R","D","N","L","S","S"],
      ["L","A","N","S","T","A","I","E","X","D"],
      ["R","X","P","K","R","J","P","X","L","N"],
      ["S","W","I","T","C","H","J","G","K","S"],
      ["H","T","T","P","D","B","D","K","J","I"],
      ["I","P","Q","W","Y","N","O","D","O","M"],
      ["D","N","S","Z","N","O","X","P","V","C"],
    ],
  },
  algoritmos: {
    words: ["STACK", "COLA", "NODO", "ARBOL", "ORDEN", "BUSCAR", "DATO", "GRAFO"],
    grid: [
      ["S","T","A","C","K","X","G","C","Q","W"],
      ["C","O","L","A","E","M","R","D","D","B"],
      ["B","R","C","N","O","D","O","N","N","N"],
      ["A","D","A","T","O","D","F","O","S","S"],
      ["A","R","B","O","L","A","O","D","X","D"],
      ["R","X","B","U","S","C","A","R","L","N"],
      ["O","R","D","E","N","H","J","G","K","S"],
      ["H","T","T","P","D","B","D","K","J","I"],
      ["I","P","G","R","A","F","O","D","O","M"],
      ["D","N","S","Z","N","O","X","P","V","C"],
    ],
  },
  seguridad: {
    words: ["VIRUS", "HACK", "CIFRAR", "CLAVE", "FIREWALL", "TOKEN", "SSL", "VPN"],
    grid: [
      ["V","I","R","U","S","X","G","C","Q","W"],
      ["H","A","C","K","E","M","C","D","D","B"],
      ["C","I","F","R","A","R","N","D","N","N"],
      ["C","L","A","V","E","D","F","O","S","S"],
      ["V","P","N","B","S","S","L","D","X","D"],
      ["F","I","R","E","W","A","L","L","L","N"],
      ["T","O","K","E","N","H","J","G","K","S"],
      ["S","S","L","P","D","B","D","K","J","I"],
      ["I","P","G","R","A","F","O","D","O","M"],
      ["D","N","S","Z","N","O","X","P","V","C"],
    ],
  },
};

function getWordset(challengeName: string) {
  const lower = challengeName.toLowerCase();
  if (lower.includes("python") || lower.includes("programacion")) return WORDSETS.python;
  if (lower.includes("red") || lower.includes("network")) return WORDSETS.redes;
  if (lower.includes("seguridad") || lower.includes("security")) return WORDSETS.seguridad;
  return WORDSETS.algoritmos;
}

interface Props {
  challengeName: string;
  onFinish: (score: number, found: number, total: number) => void;
}

export default function WordSearchGame({ challengeName, onFinish }: Props) {
  const wordset = getWordset(challengeName);
  const { words, grid } = wordset;

  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [selecting, setSelecting] = useState(false);
  const [startCell, setStartCell] = useState<[number, number] | null>(null);
  const [currentCells, setCurrentCells] = useState<[number, number][]>([]);
  const [highlightedCells, setHighlightedCells] = useState<Map<string, string>>(new Map());
  const [lastFound, setLastFound] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const cellKey = (r: number, c: number) => `${r},${c}`;

  function getCellsBetween(start: [number, number], end: [number, number]): [number, number][] {
    const [r1, c1] = start;
    const [r2, c2] = end;
    const dr = Math.sign(r2 - r1);
    const dc = Math.sign(c2 - c1);
    const dist = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1));
    const cells: [number, number][] = [];
    for (let i = 0; i <= dist; i++) {
      cells.push([r1 + dr * i, c1 + dc * i]);
    }
    return cells;
  }

  function getWordFromCells(cells: [number, number][]) {
    return cells.map(([r, c]) => grid[r]?.[c] || "").join("");
  }

  const colors = ["#0EA5E9", "#22C55E", "#A855F7", "#F59E0B", "#EF4444", "#06B6D4", "#8B5CF6", "#10B981", "#F97316", "#EC4899"];

  function checkSelection(cells: [number, number][]) {
    if (cells.length < 2) return;
    const word = getWordFromCells(cells);
    const wordRev = word.split("").reverse().join("");
    const found = words.find((w) => w === word || w === wordRev);
    if (found && !foundWords.has(found)) {
      const color = colors[foundWords.size % colors.length];
      const newHighlights = new Map(highlightedCells);
      cells.forEach(([r, c]) => newHighlights.set(cellKey(r, c), color));
      setHighlightedCells(newHighlights);
      const newFound = new Set(foundWords);
      newFound.add(found);
      setFoundWords(newFound);
      setLastFound(found);
      setTimeout(() => setLastFound(null), 1500);
      if (newFound.size === words.length) {
        setFinished(true);
        const score = Math.round((newFound.size / words.length) * 150);
        onFinish(score, newFound.size, words.length);
      }
    }
  }

  return (
    <div className="space-y-4">
      {lastFound && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#22C55E] text-white font-bold px-6 py-3 rounded-full text-lg shadow-lg"
        >
          ¡ {lastFound} encontrado!
        </motion.div>
      )}

      <div className="flex gap-2 flex-wrap">
        {words.map((w) => (
          <span
            key={w}
            className={cn(
              "px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-all",
              foundWords.has(w)
                ? "bg-[#22C55E]/20 border-[#22C55E] text-[#22C55E] line-through opacity-60"
                : "bg-white/5 border-white/20 text-white"
            )}
          >
            {foundWords.has(w) && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
            {w}
          </span>
        ))}
      </div>

      <div
        className="select-none touch-none"
        onMouseLeave={() => {
          if (selecting) {
            setSelecting(false);
            setStartCell(null);
            setCurrentCells([]);
          }
        }}
      >
        {grid.map((row, r) => (
          <div key={r} className="flex">
            {row.map((letter, c) => {
              const key = cellKey(r, c);
              const bgColor = highlightedCells.get(key);
              const isSelecting = currentCells.some(([cr, cc]) => cr === r && cc === c);
              return (
                <div
                  key={c}
                  className={cn(
                    "w-9 h-9 flex items-center justify-center text-sm font-bold font-mono cursor-pointer rounded transition-all",
                    isSelecting ? "bg-[#0EA5E9]/40 text-white scale-110" : "text-white/80 hover:bg-white/10"
                  )}
                  style={bgColor ? { backgroundColor: bgColor + "40", color: bgColor, border: `1px solid ${bgColor}60` } : {}}
                  onMouseDown={() => {
                    setSelecting(true);
                    setStartCell([r, c]);
                    setCurrentCells([[r, c]]);
                  }}
                  onMouseEnter={() => {
                    if (selecting && startCell) {
                      const cells = getCellsBetween(startCell, [r, c]);
                      setCurrentCells(cells);
                    }
                  }}
                  onMouseUp={() => {
                    if (selecting) {
                      checkSelection(currentCells);
                      setSelecting(false);
                      setStartCell(null);
                      setCurrentCells([]);
                    }
                  }}
                >
                  {letter}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {foundWords.size}/{words.length} palabras encontradas
        </span>
        {finished && (
          <Button size="sm" onClick={() => onFinish(Math.round((foundWords.size / words.length) * 150), foundWords.size, words.length)} className="bg-[#22C55E] gap-2">
            <Trophy className="w-4 h-4" />
            Ver resultados
          </Button>
        )}
        {!finished && foundWords.size > 0 && (
          <Button size="sm" variant="outline" onClick={() => onFinish(Math.round((foundWords.size / words.length) * 150), foundWords.size, words.length)}>
            Terminar
          </Button>
        )}
      </div>
    </div>
  );
}
