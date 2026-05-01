// Contexto de autenticacion: maneja el estado global del usuario
// Provee funciones de login, logout y registro al resto de la aplicacion
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

// Tipo del perfil de usuario
interface Profile {
  id: number;
  nombre: string;
  usuario: string;
  rol: "estudiante" | "docente";
  grado_bachillerato: number | null;
  avatar_url: string | null;
  puntos_totales: number;
  retos_completados: number;
  racha_dias: number;
  ultimo_acceso: string | null;
  creado_en: string;
  ultimo_nivel_intento: string | null;
  mejor_puntaje_por_modulo: unknown;
}

interface AuthContextType {
  user: Profile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (usuario: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: {
    nombre: string;
    usuario: string;
    password: string;
    rol: "estudiante" | "docente";
    grado_bachillerato?: number;
  }) => Promise<void>;
  setUser: (user: Profile) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Al montar el componente, recupera el token guardado y valida la sesion
  useEffect(() => {
    const savedToken = localStorage.getItem("cerebrito_token");
    if (savedToken) {
      setToken(savedToken);
      // Configura el getter del token para que todas las peticiones API usen el token
      setAuthTokenGetter(() => savedToken);
      // Verifica que el token sigue siendo valido
      fetchCurrentUser(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Obtiene el usuario actual usando el token JWT
  const fetchCurrentUser = async (authToken: string) => {
    try {
      const response = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token invalido - limpia la sesion
        localStorage.removeItem("cerebrito_token");
        setToken(null);
        setAuthTokenGetter(null);
      }
    } catch {
      localStorage.removeItem("cerebrito_token");
      setToken(null);
      setAuthTokenGetter(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Inicia sesion: llama al endpoint de login y guarda el token
  const login = async (usuario: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, password }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Error al iniciar sesion");
    }

    const data = await response.json();
    localStorage.setItem("cerebrito_token", data.token);
    setAuthTokenGetter(() => data.token);
    setToken(data.token);
    setUser(data.user);
  };

  // Registra un nuevo usuario y lo autentica automaticamente
  const register = async (userData: {
    nombre: string;
    usuario: string;
    password: string;
    rol: "estudiante" | "docente";
    grado_bachillerato?: number;
  }) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Error al registrarse");
    }

    const data = await response.json();
    localStorage.setItem("cerebrito_token", data.token);
    setAuthTokenGetter(() => data.token);
    setToken(data.token);
    setUser(data.user);
  };

  // Cierra la sesion: elimina el token y limpia el estado
  const logout = () => {
    localStorage.removeItem("cerebrito_token");
    setAuthTokenGetter(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para acceder al contexto de autenticacion
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
