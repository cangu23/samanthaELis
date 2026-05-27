// Barra de navegacion principal - sin componentes Radix UI para evitar conflictos con portales
import { Link, useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contextos/AuthContext";
import { Badge } from "@/componentes/interfaz/badge";
import {
  Trophy, BookOpen, LayoutDashboard, LogOut, Bell,
  User, Menu, X, Zap, ChevronDown, Gamepad2,
} from "lucide-react";
import { cn } from "@/utilidades/utils";

export function Navbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Cierra el menu de perfil al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const isDocente = user.rol === "docente";

  const navLinks = [
    { href: "/dashboard", label: "Inicio",    icon: LayoutDashboard },
    { href: "/juegos",    label: "Juegos",     icon: Gamepad2 },
    { href: "/modules",   label: "Módulos",    icon: BookOpen },
    { href: "/ranking",   label: "Ranking",    icon: Trophy },
    { href: "/inbox",     label: "Bandeja",    icon: Bell },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/dashboard">
            <div className="flex items-center gap-2 cursor-pointer hover:scale-[1.03] transition-transform">
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <span className="font-orbitron text-lg font-bold text-foreground hidden sm:block">
                Cere<span className="text-primary">brito</span>
              </span>
            </div>
          </Link>

          {/* Links desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = location === href || location.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Derecha: puntos + perfil */}
          <div className="flex items-center gap-3">
            {/* Puntos */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <Trophy className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-primary font-mono">
                {user.puntos_totales.toLocaleString()}
              </span>
            </div>

            {/* Menu de perfil - sin Radix, solo div + estado */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white">
                  {user.nombre.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium hidden sm:block max-w-[100px] truncate">
                  {user.nombre.split(" ")[0]}
                </span>
                <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", profileOpen && "rotate-180")} />
              </button>

              {/* Dropdown de perfil */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-border/50">
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

                  <Link
                    href="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-muted transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Mi Perfil
                  </Link>

                  <div className="border-t border-border/50">
                    <button
                      onClick={() => { setProfileOpen(false); logout(); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesion
                    </button>
                  </div>
                </div>
              )}
            </div>

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
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95">
          <div className="px-4 py-3 flex flex-col gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = location === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}

            <Link
              href="/profile"
              onClick={() => setMobileOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <User className="w-4 h-4" />
              Mi Perfil
            </Link>

            <div className="mt-1 pt-1 border-t border-border/50">
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesion
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
