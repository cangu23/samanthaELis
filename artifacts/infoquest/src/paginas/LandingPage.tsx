// Pagina de inicio - Landing page con mascota animada y call-to-action
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/componentes/interfaz/button";
import { Badge } from "@/componentes/interfaz/badge";
import { RobotMascot } from "@/componentes/mascota/RobotMascot";
import {
  Zap,
  Trophy,
  Shield,
  BookOpen,
  Code2,
  ArrowRight,
  Star,
  Users,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    color: "#0EA5E9",
    title: "3 Módulos Completos",
    desc: "Contenido estructurado para 1°, 2° y 3° de Bachillerato en Informática",
  },
  {
    icon: Zap,
    color: "#F59E0B",
    title: "Retos",
    desc: "Quiz, código, puzzles de seguridad, drag & drop y carreras contra el tiempo",
  },
  {
    icon: Trophy,
    color: "#22C55E",
    title: "Ranking Competitivo",
    desc: "Compite con tus compañeros y asciende en la tabla de clasificacion",
  },
  {
    icon: Shield,
    color: "#A855F7",
    title: "Ciberseguridad",
    desc: "Aprende fundamentos de seguridad informatica",
  },
];

const stats = [
  { label: "Módulos", value: "3" },
  { label: "Tipos de Reto", value: "2+" },
  { label: "Preguntas", value: "2+" },
  { label: "Niveles", value: "3" },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Fondo con cuadricula cyber */}
      <div className="fixed inset-0 cyber-grid opacity-30 pointer-events-none" />

      {/* Header de la landing */}
      <header className="relative z-10 px-6 py-5 flex items-center justify-between max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <span className="font-orbitron text-xl font-bold">
            Cere<span className="text-primary">brito</span>
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Iniciar Sesion
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="neon-border">
              Registrarse
            </Button>
          </Link>
        </motion.div>
      </header>

      {/* Hero section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Contenido izquierdo */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4 bg-primary/15 text-primary border-primary/30 px-3 py-1">
              <Star className="w-3 h-3 mr-1" />
              Plataforma Educativa para Bachillerato
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Aprende{" "}
              <span className="text-primary font-orbitron">Informatica</span>
              <br />
              de forma{" "}
              <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                épica
              </span>
            </h1>

            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Cerebrito es la plataforma de competicion para
              estudiantes de bachillerato en Informatica del Colegio Cumbaya. Completa
              retos, gana puntos y demuestra quien domina la programacion.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <Link href="/register">
                <Button size="lg" className="gap-2 neon-border text-base px-6">
                  Empezar Ahora
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 text-base px-6"
                >
                  <Users className="w-5 h-5" />
                  Soy Docente
                </Button>
              </Link>
            </div>

            {/* Estadisticas */}
            <div className="grid grid-cols-4 gap-4">
              {stats.map(({ label, value }) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center p-3 rounded-xl bg-card/50 border border-border/50"
                >
                  <div className="text-2xl font-bold font-orbitron text-primary">
                    {value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Mascota robot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex flex-col items-center"
          >
            {/* Halo de fondo brillante */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full bg-secondary/5 blur-2xl" />
              </div>
              <RobotMascot size="xl" mood="excited" />
            </div>

            {/* Mensaje del robot */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-2 px-4 py-2 rounded-xl bg-card/80 border border-primary/30 text-sm text-center max-w-xs"
            >
              <span className="text-primary font-semibold">
                ¡Hola, explorador!
              </span>
              <span className="text-muted-foreground">
                {" "}
                Listo para conquistar el conocimiento digital?
              </span>
            </motion.div>
          </motion.div>
        </div>

        {/* Cards de caracteristicas */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {features.map(({ icon: Icon, color, title, desc }) => (
            <motion.div
              key={title}
              whileHover={{ y: -4, scale: 1.02 }}
              className="p-5 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-sm cursor-default"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{
                  backgroundColor: `${color}20`,
                  border: `1px solid ${color}40`,
                }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <h3 className="font-semibold text-sm mb-1">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {desc}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Banner modulos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-16 p-6 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5"
        >
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">
                Contenido variado para el Bachillerato
              </h2>
              <p className="text-muted-foreground text-sm">
                De poquito en poquito para poder repasar 
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { year: "1°", topic: "Fundamentos Python", color: "#0EA5E9" },
                { year: "2°", topic: "POO y Bases de Datos", color: "#A855F7" },
                { year: "3°", topic: "Redes y Seguridad", color: "#22C55E" },
              ].map(({ year, topic, color }) => (
                <div
                  key={year}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{
                    backgroundColor: `${color}15`,
                    border: `1px solid ${color}30`,
                  }}
                >
                  <Code2 className="w-4 h-4" style={{ color }} />
                  <div>
                    <div className="text-xs font-bold" style={{ color }}>
                      {year} Bachillerato
                    </div>
                    <div className="text-xs text-muted-foreground">{topic}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer minimalista */}
      <footer className="relative z-10 border-t border-border/50 py-6 text-center text-xs text-muted-foreground">
        Cerebrito — Plataforma Educativa para Bachillerato en Informática · Nacional Cumbaya  
      </footer>
    </div>
  );
}
