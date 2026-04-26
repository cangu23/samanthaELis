// Mascota animada de InfoQuest - Robot con personalidad gamer
// Animaciones CSS puras: flotacion, parpadeo de ojos, saludo con brazo
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RobotMascotProps {
  size?: "sm" | "md" | "lg" | "xl";
  mood?: "happy" | "thinking" | "excited" | "correct" | "wrong";
  className?: string;
}

const sizeMap = {
  sm: { container: "w-16 h-20", body: 48, head: 36 },
  md: { container: "w-24 h-32", body: 72, head: 56 },
  lg: { container: "w-36 h-48", body: 108, head: 84 },
  xl: { container: "w-48 h-64", body: 140, head: 112 },
};

export function RobotMascot({
  size = "lg",
  mood = "happy",
  className,
}: RobotMascotProps) {
  const s = sizeMap[size];
  const scale = s.body / 108;

  // Colores segun estado de animo
  const eyeColor =
    mood === "correct"
      ? "#22C55E"
      : mood === "wrong"
        ? "#EF4444"
        : mood === "excited"
          ? "#F59E0B"
          : "#0EA5E9";

  return (
    <motion.div
      className={cn("relative inline-flex flex-col items-center", className)}
      animate={{
        y: [0, -12, 0],
        rotate: [-1, 1, -1],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <svg
        width={s.body * 1.2}
        height={s.body * 1.5}
        viewBox="0 0 144 216"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Antena */}
        <motion.g
          animate={{ rotate: mood === "excited" ? [0, 15, -15, 0] : [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "72px 20px" }}
        >
          <rect x="68" y="2" width="8" height="20" rx="4" fill="#0EA5E9" />
          <circle cx="72" cy="4" r="6" fill="#06B6D4">
            <animate attributeName="r" values="6;8;6" dur="1.5s" repeatCount="indefinite" />
            <animate
              attributeName="fill"
              values="#06B6D4;#0EA5E9;#06B6D4"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
          {/* Halo brillante */}
          <circle cx="72" cy="4" r="10" fill="none" stroke="#0EA5E9" strokeWidth="2" opacity="0.4">
            <animate attributeName="r" values="8;14;8" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0;0.4" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </motion.g>

        {/* Cabeza */}
        <rect x="24" y="20" width="96" height="76" rx="18" fill="#0F172A" />
        <rect x="24" y="20" width="96" height="76" rx="18" fill="url(#headGrad)" />
        <rect x="24" y="20" width="96" height="76" rx="18" stroke="#0EA5E9" strokeWidth="2.5" />

        {/* Visor de vidrio en la frente */}
        <rect x="30" y="26" width="84" height="8" rx="4" fill="#0EA5E9" opacity="0.15" />

        {/* Ojos */}
        {/* Ojo izquierdo */}
        <g>
          <rect x="36" y="40" width="28" height="28" rx="8" fill="#0D1B2A" />
          <rect x="36" y="40" width="28" height="28" rx="8" stroke={eyeColor} strokeWidth="2" />
          <motion.rect
            x="46"
            y="50"
            width="8"
            height="8"
            rx="2"
            fill={eyeColor}
            animate={{
              scaleY: [1, 0.1, 1],
            }}
            transition={{
              duration: 0.2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
            style={{ transformOrigin: "50px 54px" }}
          />
          {/* Brillo */}
          <circle cx="48" cy="48" r="2" fill="white" opacity="0.7" />
        </g>

        {/* Ojo derecho */}
        <g>
          <rect x="80" y="40" width="28" height="28" rx="8" fill="#0D1B2A" />
          <rect x="80" y="40" width="28" height="28" rx="8" stroke={eyeColor} strokeWidth="2" />
          <motion.rect
            x="90"
            y="50"
            width="8"
            height="8"
            rx="2"
            fill={eyeColor}
            animate={{
              scaleY: [1, 0.1, 1],
            }}
            transition={{
              duration: 0.2,
              repeat: Infinity,
              repeatDelay: 3,
              delay: 0.1,
            }}
            style={{ transformOrigin: "94px 54px" }}
          />
          <circle cx="92" cy="48" r="2" fill="white" opacity="0.7" />
        </g>

        {/* Boca / Expresion */}
        {mood === "happy" || mood === "excited" ? (
          <path
            d="M 44 80 Q 72 90 100 80"
            stroke={eyeColor}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        ) : mood === "wrong" ? (
          <path
            d="M 44 88 Q 72 78 100 88"
            stroke="#EF4444"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        ) : (
          <rect x="44" y="82" width="56" height="4" rx="2" fill={eyeColor} opacity="0.6" />
        )}

        {/* Cuello */}
        <rect x="62" y="96" width="20" height="12" rx="4" fill="#0F172A" stroke="#0EA5E9" strokeWidth="1.5" />

        {/* Cuerpo */}
        <rect x="18" y="108" width="108" height="80" rx="16" fill="#0F172A" />
        <rect x="18" y="108" width="108" height="80" rx="16" fill="url(#bodyGrad)" />
        <rect x="18" y="108" width="108" height="80" rx="16" stroke="#0EA5E9" strokeWidth="2" />

        {/* Panel central del cuerpo */}
        <rect x="36" y="118" width="72" height="50" rx="10" fill="#0D1B2A" opacity="0.8" />
        <rect x="36" y="118" width="72" height="50" rx="10" stroke="#1E3A5F" strokeWidth="1" />

        {/* Indicadores en el panel */}
        <circle cx="52" cy="130" r="4" fill="#22C55E">
          <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />
        </circle>
        <circle cx="68" cy="130" r="4" fill="#0EA5E9">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />
        </circle>
        <circle cx="84" cy="130" r="4" fill="#A855F7">
          <animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.5s" repeatCount="indefinite" />
        </circle>

        {/* Barras de energia */}
        <rect x="44" y="142" width="56" height="6" rx="3" fill="#1E3A5F" />
        <rect x="44" y="142" width={mood === "excited" ? "56" : "40"} height="6" rx="3" fill="#22C55E" opacity="0.8" />
        <rect x="44" y="152" width="56" height="6" rx="3" fill="#1E3A5F" />
        <rect x="44" y="152" width="32" height="6" rx="3" fill="#0EA5E9" opacity="0.8" />

        {/* Brazo izquierdo - animado como saludo */}
        <motion.g
          animate={{
            rotate: mood === "excited" ? [0, 25, 0, 25, 0] : [0, 10, 0],
          }}
          transition={{
            duration: mood === "excited" ? 0.5 : 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "18px 130px" }}
        >
          <rect x="-8" y="110" width="26" height="14" rx="7" fill="#0F172A" stroke="#0EA5E9" strokeWidth="1.5" />
          <rect x="-16" y="122" width="16" height="50" rx="8" fill="#0F172A" stroke="#0EA5E9" strokeWidth="1.5" />
          {/* Mano */}
          <circle cx="-8" cy="172" r="10" fill="#0F172A" stroke="#0EA5E9" strokeWidth="1.5" />
          <circle cx="-8" cy="172" r="5" fill="#0EA5E9" opacity="0.5" />
        </motion.g>

        {/* Brazo derecho */}
        <motion.g
          animate={{ rotate: [0, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          style={{ transformOrigin: "126px 130px" }}
        >
          <rect x="126" y="110" width="26" height="14" rx="7" fill="#0F172A" stroke="#0EA5E9" strokeWidth="1.5" />
          <rect x="144" y="122" width="16" height="50" rx="8" fill="#0F172A" stroke="#0EA5E9" strokeWidth="1.5" />
          <circle cx="152" cy="172" r="10" fill="#0F172A" stroke="#0EA5E9" strokeWidth="1.5" />
          <circle cx="152" cy="172" r="5" fill="#0EA5E9" opacity="0.5" />
        </motion.g>

        {/* Piernas */}
        <rect x="40" y="186" width="22" height="24" rx="8" fill="#0F172A" stroke="#0EA5E9" strokeWidth="1.5" />
        <rect x="82" y="186" width="22" height="24" rx="8" fill="#0F172A" stroke="#0EA5E9" strokeWidth="1.5" />

        {/* Pies */}
        <rect x="32" y="206" width="34" height="12" rx="6" fill="#0F172A" stroke="#0EA5E9" strokeWidth="1.5" />
        <rect x="78" y="206" width="34" height="12" rx="6" fill="#0F172A" stroke="#0EA5E9" strokeWidth="1.5" />

        {/* Gradientes */}
        <defs>
          <linearGradient id="headGrad" x1="24" y1="20" x2="24" y2="96" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="bodyGrad" x1="18" y1="108" x2="18" y2="188" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0.05" />
          </linearGradient>
        </defs>
      </svg>

      {/* Sombra en el suelo */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-primary/20 blur-md"
        style={{ width: `${s.body * 0.6}px`, height: "8px" }}
        animate={{ width: [`${s.body * 0.5}px`, `${s.body * 0.7}px`, `${s.body * 0.5}px`] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}
