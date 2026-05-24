// Pagina de registro de nuevos usuarios (solo estudiantes)
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contextos/AuthContext";
import { Button } from "@/componentes/interfaz/button";
import { Input } from "@/componentes/interfaz/input";
import { Label } from "@/componentes/interfaz/label";
import { Alert, AlertDescription } from "@/componentes/interfaz/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/componentes/interfaz/select";
import { RobotMascot } from "@/componentes/mascota/RobotMascot";
import { Zap, Eye, EyeOff, AlertCircle, UserPlus } from "lucide-react";

export function RegisterPage() {
  const { register } = useAuth();
  const [, navigate] = useLocation();

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
    if (!grado) {
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
        rol: "estudiante",
        grado_bachillerato: parseInt(grado),
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
          <p className="text-muted-foreground text-sm">Crea tu cuenta de estudiante</p>
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

          <div className="mt-3 p-3 rounded-xl border border-border/30 bg-muted/20 text-xs text-muted-foreground text-center">
            ¿Eres docente? Contacta al administrador para obtener tu cuenta.
          </div>
        </div>
      </div>
    </div>
  );
}
