import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contextos/AuthContext";
import { Button } from "@/componentes/interfaz/button";
import { Input } from "@/componentes/interfaz/input";
import { Label } from "@/componentes/interfaz/label";
import { Alert, AlertDescription } from "@/componentes/interfaz/alert";
import { RobotMascot } from "@/componentes/mascota/RobotMascot";
import { Zap, AlertCircle, UserPlus, Eye, EyeOff } from "lucide-react";

// ✅ Valida que la contraseña cumpla todos los requisitos
function validarPassword(pass: string): string {
  if (pass.length < 8) return "Mínimo 8 caracteres";
  if (!/[A-Z]/.test(pass)) return "Debe tener al menos una mayúscula";
  if (!/[a-z]/.test(pass)) return "Debe tener al menos una minúscula";
  if (!/[0-9]/.test(pass)) return "Debe tener al menos un número";
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)) return "Debe tener al menos un carácter especial";
  return "";
}

export function RegisterPage() {
  const { register } = useAuth();
  const [, navigate] = useLocation();

  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<"estudiante" | "docente">("estudiante");
  const [grado, setGrado] = useState("");
  const [email, setEmail] = useState("");
  const [codigoDocente, setCodigoDocente] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);

  // ✅ Errores por campo
  const [errorCedula, setErrorCedula] = useState("");
  const [errorPassword, setErrorPassword] = useState("");

  // ✅ Maneja cambio de cédula: solo números, máximo 10
  const handleCedulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, "").slice(0, 10);
    setCedula(valor);
    if (valor.length > 0 && valor.length !== 10) {
      setErrorCedula("La cédula debe tener exactamente 10 dígitos");
    } else {
      setErrorCedula("");
    }
  };

  // ✅ Maneja cambio de contraseña con validación en tiempo real
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setPassword(valor);
    if (valor.length > 0) {
      setErrorPassword(validarPassword(valor));
    } else {
      setErrorPassword("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones antes de enviar
    if (!nombre.trim() || !cedula.trim() || !usuario.trim() || !password.trim()) {
      setError("Completa todos los campos obligatorios");
      return;
    }
    if (cedula.length !== 10) {
      setError("La cédula debe tener exactamente 10 dígitos");
      return;
    }
    const errPass = validarPassword(password);
    if (errPass) {
      setError(errPass);
      return;
    }
    if (rol === "docente" && !codigoDocente.trim()) {
      setError("El código de docente es obligatorio");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await register({
        nombre: nombre.trim(),
        cedula: cedula.trim(),
        usuario: usuario.trim(),
        password,
        rol,
        grado_bachillerato: grado ? Number(grado) : undefined,
        email: email.trim() || undefined,
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
          <p className="text-muted-foreground text-sm">Crea tu cuenta y empieza a aprender</p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h1 className="text-xl font-bold mb-6 text-center">Crear Cuenta</h1>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre completo <span className="text-red-500">*</span></Label>
              <Input id="nombre" type="text" placeholder="Tu nombre" value={nombre}
                onChange={(e) => setNombre(e.target.value)} disabled={loading} />
            </div>

            {/* ✅ Cédula con validación */}
            <div className="space-y-2">
              <Label htmlFor="cedula">Cédula <span className="text-red-500">*</span></Label>
              <Input
                id="cedula"
                type="text"
                inputMode="numeric"
                placeholder="1234567890"
                value={cedula}
                onChange={handleCedulaChange}
                disabled={loading}
                maxLength={10}
                className={errorCedula ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errorCedula && (
                <p className="text-red-500 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errorCedula}
                </p>
              )}
            </div>

            {/* Usuario */}
            <div className="space-y-2">
              <Label htmlFor="usuario">Usuario <span className="text-red-500">*</span></Label>
              <Input id="usuario" type="text" placeholder="tu_usuario" value={usuario}
                onChange={(e) => setUsuario(e.target.value)} disabled={loading} />
            </div>

            {/* ✅ Contraseña con ojito + validación en tiempo real */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  type={mostrarPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={handlePasswordChange}
                  disabled={loading}
                  className={`pr-10 ${errorPassword ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Mensaje de error o requisitos */}
              {errorPassword ? (
                <p className="text-red-500 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errorPassword}
                </p>
              ) : password.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo
                </p>
              ) : (
                <p className="text-green-500 text-xs">✓ Contraseña segura</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)} disabled={loading} />
            </div>

            {/* Rol */}
            <div className="space-y-2">
              <Label htmlFor="rol">Rol <span className="text-red-500">*</span></Label>
              <select id="rol" value={rol} onChange={(e) => setRol(e.target.value as "estudiante" | "docente")}
                disabled={loading}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="estudiante">Estudiante</option>
                <option value="docente">Docente</option>
              </select>
            </div>

            {rol === "estudiante" && (
              <div className="space-y-2">
                <Label htmlFor="grado">Grado de bachillerato</Label>
                <Input id="grado" type="number" placeholder="1" min="1" max="3" value={grado}
                  onChange={(e) => setGrado(e.target.value)} disabled={loading} />
              </div>
            )}

            {rol === "docente" && (
              <div className="space-y-2">
                <Label htmlFor="codigo_docente">Código de docente <span className="text-red-500">*</span></Label>
                <Input
                  id="codigo_docente"
                  type="password"
                  placeholder="Código proporcionado por el administrador"
                  value={codigoDocente}
                  onChange={(e) => setCodigoDocente(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">Solo el administrador del sistema tiene este código.</p>
              </div>
            )}

            <Button type="submit" className="w-full gap-2 mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Registrando...
                </span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Crear cuenta
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login">
              <span className="text-primary hover:underline cursor-pointer font-medium">
                Inicia sesion aqui
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}