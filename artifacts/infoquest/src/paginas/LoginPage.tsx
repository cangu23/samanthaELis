import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contextos/AuthContext";
import { Button } from "@/componentes/interfaz/button";
import { Input } from "@/componentes/interfaz/input";
import { Label } from "@/componentes/interfaz/label";
import { Alert, AlertDescription } from "@/componentes/interfaz/alert";
import { RobotMascot } from "@/componentes/mascota/RobotMascot";
import { GoogleLoginButton } from "@/contextos/GoogleLoginButton";
import { Zap, Eye, EyeOff, AlertCircle, LogIn } from "lucide-react";

export function LoginPage() {
  const { login } = useAuth();
  const [, navigate] = useLocation();

  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !password.trim()) {
      setError("Completa todos los campos");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(usuario.trim(), password);
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 cyber-grid opacity-20 pointer-events-none" />

      <div className="page-enter relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-2 mb-4 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <span className="font-orbitron text-2xl font-bold">
                Cere<span className="text-primary">brito</span>
              </span>
            </div>
          </Link>
          <RobotMascot size="md" mood="happy" className="mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">
            Bienvenido de vuelta, explorador
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h1 className="text-xl font-bold mb-6 text-center">Iniciar Sesion</h1>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usuario">
                Usuario <span className="text-red-500">*</span>
              </Label>
              <Input
                id="usuario"
                type="text"
                placeholder="tu_usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Contraseña <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
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
                  Entrando...
                </span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Entrar
                </>
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
            </div>
          </div>

          <GoogleLoginButton />

          <div className="mt-3 text-center">
            <Link href="/forgot-password">
              <span className="text-sm text-muted-foreground hover:text-[#A855F7] transition-colors cursor-pointer">
                ¿Olvidaste tu contraseña?
              </span>
            </Link>
          </div>

          <div className="mt-3 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/register">
              <span className="text-primary hover:underline cursor-pointer font-medium">
                Registrate aqui
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}