// Pagina de registro de nuevos usuarios (estudiantes y docentes)
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RobotMascot } from "@/components/mascot/RobotMascot";
import { Zap, Eye, EyeOff, AlertCircle, UserPlus, GraduationCap, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type Rol = "estudiante" | "docente";

export function RegisterPage() {
  const { register } = useAuth();
  const [, navigate] = useLocation();

  const [rol, setRol] = useState<Rol>("estudiante");
  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [grado, setGrado] = useState<string>("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim() || !usuario.trim() || !password.trim()) {
      setError("Completa todos los campos obligatorios");
      return;
    }
    if (password.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres");
      return;
    }
    if (rol === "estudiante" && !grado) {
      setError("Selecciona tu grado de bachillerato");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await register({
        nombre: nombre.trim(),
        usuario: usuario.trim().toLowerCase(),
        password,
        rol,
        grado_bachillerato: rol === "estudiante" ? parseInt(grado) : undefined,
      });
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 cyber-grid opacity-20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/">
            <div className="inline-flex items-center gap-2 mb-3 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <span className="font-orbitron text-2xl font-bold">
                Cere<span className="text-primary">brito</span>
              </span>
            </div>
          </Link>
          <RobotMascot size="sm" mood="excited" className="mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Crea tu cuenta y empieza la aventura</p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h1 className="text-xl font-bold mb-5 text-center">Crear Cuenta</h1>

          {/* Selector de rol */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {(["estudiante", "docente"] as Rol[]).map((r) => {
              const Icon = r === "estudiante" ? GraduationCap : BookOpen;
              const label = r === "estudiante" ? "Estudiante" : "Docente";
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRol(r)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium",
                    rol === r
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-border/80"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              );
            })}
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre Completo</Label>
              <Input
                id="nombre"
                placeholder="Ana Torres"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="usuario">Nombre de Usuario</Label>
              <Input
                id="usuario"
                placeholder="ana_torres"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">Solo letras, numeros y guiones bajos</p>
            </div>

            {rol === "estudiante" && (
              <div className="space-y-1.5">
                <Label>Grado de Bachillerato</Label>
                <Select value={grado} onValueChange={setGrado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu grado..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1° de Bachillerato</SelectItem>
                    <SelectItem value="2">2° de Bachillerato</SelectItem>
                    <SelectItem value="3">3° de Bachillerato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="Minimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full gap-2 mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Registrando...
                </span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Crear Cuenta
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login">
              <span className="text-primary hover:underline cursor-pointer font-medium">
                Inicia sesion
              </span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
