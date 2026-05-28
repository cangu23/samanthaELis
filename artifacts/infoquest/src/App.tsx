// App principal de Cerebrito - Router y layout global
import { Switch, Route, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contextos/AuthContext";
import { Navbar } from "@/componentes/diseno/Navbar";
import { LandingPage } from "@/paginas/LandingPage";
import { LoginPage } from "@/paginas/LoginPage";
import { RegisterPage } from "@/paginas/RegisterPage";
import { DashboardPage } from "@/paginas/DashboardPage";
import { ModulesPage } from "@/paginas/ModulesPage";
import { ChallengePage } from "@/paginas/ChallengePage";
import { RankingPage } from "@/paginas/RankingPage";
import { InboxPage } from "@/paginas/InboxPage";
import { ProfilePage } from "@/paginas/ProfilePage";
import { CreateChallengePage } from "@/paginas/CreateChallengePage";
import { JuegosPage } from "@/paginas/JuegosPage";
import { CompetirPage } from "@/paginas/CompetirPage";
import { ForgotPasswordPage } from "@/paginas/ForgotPasswordPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

// Ruta protegida: redirige al login si no esta autenticado
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Cargando Cerebrito...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

// Ruta publica: redirige al dashboard si ya esta autenticado
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  return <>{children}</>;
}

// Layout de paginas autenticadas con navbar y contenido con padding
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-12">
        {children}
      </main>
    </div>
  );
}

// Componente de rutas principal - usa base URL del entorno de Replit
function AppRoutes() {
  return (
    <Switch>
      {/* Paginas publicas */}
      <Route path="/">
        <PublicRoute>
          <LandingPage />
        </PublicRoute>
      </Route>

      <Route path="/login">
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      </Route>

      <Route path="/register">
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      </Route>

      <Route path="/forgot-password">
        <ForgotPasswordPage />
      </Route>

      {/* Paginas protegidas */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <AppLayout>
            <DashboardPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/modules">
        <ProtectedRoute>
          <AppLayout>
            <ModulesPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/challenge/:id">
        <ProtectedRoute>
          <AppLayout>
            <ChallengePage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/ranking">
        <ProtectedRoute>
          <AppLayout>
            <RankingPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/inbox">
        <ProtectedRoute>
          <AppLayout>
            <InboxPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/profile">
        <ProtectedRoute>
          <AppLayout>
            <ProfilePage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/juegos">
        <ProtectedRoute>
          <AppLayout>
            <JuegosPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/challenges">
        <ProtectedRoute>
          <AppLayout>
            <JuegosPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/challenges/create">
        <ProtectedRoute>
          <AppLayout>
            <CreateChallengePage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      {/* Sesion de competencia publica: estudiante entra con el link del docente */}
      <Route path="/competir/:code">
        <ProtectedRoute>
          <CompetirPage />
        </ProtectedRoute>
      </Route>

      {/* Ruta 404 - redirige al inicio */}
      <Route>
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="dark">
          <AppRoutes />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}
