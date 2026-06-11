import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/componentes/interfaz/button";
import { Input } from "@/componentes/interfaz/input";
import { Label } from "@/componentes/interfaz/label";
import { Alert, AlertDescription } from "@/componentes/interfaz/alert";
import { Zap, AlertCircle, ArrowLeft, KeyRound, CheckCircle2, Eye, EyeOff } from "lucide-react";

type Paso = "solicitar" | "resetear" | "listo";

export function ForgotPasswordPage() {
  const [paso, setPaso] = useState<Paso>("solicitar");
  const [cedula, setCedula] = useState("");
  const [token, setToken] = useState("");
  const [devToken, setDevToken] = useState<string | null>(null);
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const solicitarReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula.trim()) { setError("Ingresa tu número de cédula"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula: cedula.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Error al procesar la solicitud"); return; }
      if (data.dev_token) setDevToken(data.dev_token);
      setPaso("resetear");
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const resetearPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) { setError("Ingresa el código de recuperación"); return; }
    if (nuevaPassword.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), nueva_password: nuevaPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Código inválido o expirado"); return; }
      setPaso("listo");
    } catch {
      setError("No se pudo conectar con el servidor");
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
          <div className="w-14 h-14 rounded-2xl bg-[#A855F7]/20 border border-[#A855F7]/40 flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-7 h-7 text-[#A855F7]" />
          </div>
          <h1 className="text-xl font-bold font-orbitron">Recuperar Contraseña</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {paso === "solicitar" && "Ingresa tu cédula para recibir un código"}
            {paso === "resetear" && "Ingresa el código y tu nueva contraseña"}
            {paso === "listo" && "Contraseña actualizada exitosamente"}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          {paso === "solicitar" && (
            <form onSubmit={solicitarReset} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="cedula">Número de cédula</Label>
                <Input
                  id="cedula"
                  placeholder="Ej: 1234567890"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">Ingresa la cédula con la que te registraste.</p>
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Procesando...
                  </span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Obtener código
                  </>
                )}
              </Button>
            </form>
          )}

          {paso === "resetear" && (
            <form onSubmit={resetearPassword} className="space-y-4">
              {devToken && (
                <div className="p-3 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-sm">
                  <p className="text-[#F59E0B] font-semibold mb-1">Código de recuperación (modo desarrollo):</p>
                  <p className="font-mono text-white text-lg tracking-widest text-center">{devToken}</p>
                  <p className="text-muted-foreground text-xs mt-1">En producción este código llega al correo registrado.</p>
                </div>
              )}
              {!devToken && (
                <div className="p-3 rounded-xl bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 text-sm text-[#0EA5E9]">
                  Si la cédula existe y tiene un correo registrado, recibirá el código de recuperación.
                </div>
              )}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="token">Código de recuperación</Label>
                <Input
                  id="token"
                  placeholder="Ej: A3F7K2"
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase())}
                  maxLength={10}
                  disabled={loading}
                  className="font-mono text-center tracking-widest text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nueva">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="nueva"
                    type={showPass ? "text" : "password"}
                    placeholder="Minimo 6 caracteres"
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    disabled={loading}
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full gap-2 bg-[#A855F7] hover:bg-[#A855F7]/80" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Actualizando...
                  </span>
                ) : "Cambiar contraseña"}
              </Button>
            </form>
          )}

          {paso === "listo" && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#22C55E]/20 border border-[#22C55E]/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-[#22C55E]" />
              </div>
              <div>
                <p className="font-semibold text-white">Contraseña actualizada</p>
                <p className="text-muted-foreground text-sm mt-1">Ya puedes iniciar sesión con tu nueva contraseña.</p>
              </div>
              <Link href="/login">
                <Button className="w-full gap-2 mt-2">Iniciar sesión</Button>
              </Link>
            </div>
          )}

          {paso !== "listo" && (
            <div className="mt-4 text-center">
              <Link href="/login">
                <span className="text-sm text-muted-foreground hover:text-white transition-colors flex items-center justify-center gap-1 cursor-pointer">
                  <ArrowLeft className="w-3 h-3" />Volver al login
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}