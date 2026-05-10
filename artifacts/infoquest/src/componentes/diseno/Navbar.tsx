// Barra de navegacion principal - visible en todas las paginas autenticadas
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/contextos/AuthContext";
import { Button } from "@/componentes/interfaz/button";
import { Badge } from "@/componentes/interfaz/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/componentes/interfaz/dropdown-menu";
import {
  Trophy,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Bell,
  User,
  Menu,
  X,
  Zap,
  ChevronDown,
  Gamepad2,
} from "lucide-react";
import { cn } from "@/utilidades/utils";

export function Navbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const isDocente = user.rol === "docente";

  const navLinks = isDocente
    ? [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/juegos", label: "Juegos", icon: Gamepad2 },
        { href: "/modules", label: "Módulos", icon: BookOpen },
        { href: "/ranking", label: "Ranking", icon: Trophy },
        { href: "/inbox", label: "Bandeja", icon: Bell },
      ]
    : [
        { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
        { href: "/juegos", label: "Juegos", icon: Gamepad2 },
        { href: "/modules", label: "Módulos", icon: BookOpen },
        { href: "/ranking", label: "Ranking", icon: Trophy },
        { href: "/inbox", label: "Bandeja", icon: Bell },
      ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard">
            <motion.div
              className="flex items-center gap-2 cursor-pointer"
              whileHover={{ scale: 1.03 }}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <span className="font-orbitron text-lg font-bold text-foreground hidden sm:block">
                Cere<span className="text-primary">brito</span>
              </span>
            </motion.div>
          </Link>

          {/* Links de navegacion - desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = location === href || location.startsWith(href + "/");
              return (
                <Link key={href} href={href}>
                  <motion.button
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </motion.button>
                </Link>
              );
            })}
          </div>

          {/* Zona derecha: puntos + perfil */}
          <div className="flex items-center gap-3">
            {/* Puntos totales del usuario */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <Trophy className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-primary font-mono">
                {user.puntos_totales.toLocaleString()}
              </span>
            </div>

            {/* Menu de perfil */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white">
                    {user.nombre.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium hidden sm:block max-w-[100px] truncate">
                    {user.nombre.split(" ")[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold">{user.nombre}</p>
                  <p className="text-xs text-muted-foreground">{user.usuario}</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "mt-1 text-xs",
                      isDocente ? "border-secondary/50 text-secondary" : "border-primary/50 text-primary"
                    )}
                  >
                    {isDocente ? "Docente" : `${user.grado_bachillerato}° Bachillerato`}
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="w-4 h-4 mr-2" />
                    Mi Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={logout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Boton menu movil */}
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-muted"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu movil */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-border/50 bg-background/95"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const active = location === href;
                return (
                  <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
                    <button
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  </Link>
                );
              })}
              <div className="mt-2 pt-2 border-t border-border/50">
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesion
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
