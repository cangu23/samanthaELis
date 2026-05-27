// Pagina de registro: estudiantes libremente, docentes con codigo secreto
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contextos/AuthContext";
import { Button } from "@/componentes/interfaz/button";
import { Input } from "@/componentes/interfaz/input";
import { Label } from "@/componentes/interfaz/label";
import { Alert, AlertDescription } from "@/componentes/interfaz/alert";
import { RobotMascot } from "@/componentes/mascota/RobotMascot";
import { Zap, Eye, EyeOff, AlertCircle, UserPlus, Lock, ChevronDown, ChevronUp } from "lucide-react";

type Rol = "estudiante" | "docente";

export function RegisterPage() {
  const { register } = useAuth();
  const [, navigate] = useLocation();

  const [rol, setRol] = useState<Rol>("estudiante");
  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [grado, setGrado] = useState<string>("");
  const [codigoDocente, setCodigoDocente] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showDocente, setShowDocente] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleToggleDocente = () => {
    const nuevo = !showDocente;
    setShowDocente(nuevo);
    setRol(nuevo ? "docente" : "estudiante");
    setCodigoDocente("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim() || !usuario.trim() || !password.trim()) {
      setError("Completa todos los campos obligatorios");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (rol === "estudiante" && !grado) {
      setError("Selecciona tu grado de bachillerato");
      return;
    }
    if (rol === "docente" && !codigoDocente.trim()) {
      setError("Ingresa el código de docente");
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
        codigo_docente: rol === "docente" ? codigoDocente.trim() : undefined,
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

      <div className="page-enter relative z-10 w-full max-w-md">
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
          <p className="text-muted-foreground text-sm">
            {rol === "docente" ? "Registro de docente" : "Crea tu cuenta de estudiante"}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h1 className="text-xl font-bold mb-5 text-center">Crear Cuenta</h1>

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
                <select
                  value={grado}
                  onChange={(e) => setGrado(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/60 transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Selecciona tu grado...</option>
                  <option value="1">1° de Bachillerato</option>
                  <option value="2">2° de Bachillerato</option>
                  <option value="3">3° de Bachillerato</option>
                </select>
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

            {/* Seccion de docente con codigo secreto */}
            <div className="rounded-xl border border-border/40 overflow-hidden">
              <button
                type="button"
                onClick={handleToggleDocente}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  ¿Eres docente? Ingresa tu código
                </span>
                {showDocente ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showDocente && (
                <div className="px-4 pb-4 pt-1 border-t border-border/30 bg-muted/10">
                  <Label htmlFor="codigo" className="text-xs mb-1.5 block">Código de Docente</Label>
                  <Input
                    id="codigo"
                    type="password"
                    placeholder="Ingresa el código secreto"
                    value={codigoDocente}
                    onChange={(e) => setCodigoDocente(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Solo el administrador del sistema tiene este código.
                  </p>
                </div>
              )}
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
      </div>
    </div>
  );
}
