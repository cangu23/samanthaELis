# Cerebrito 🧠
**Plataforma gamificada de Informática para Bachillerato — Colegio Nacional Cumbaya**

Cerebrito es una aplicación web educativa y competitiva para estudiantes de 1°, 2° y 3° de Bachillerato en Informática. Permite completar retos interactivos, ganar puntos, competir en un ranking y recibir retroalimentación del docente.

---

## ¿Qué incluye?

- 7 tipos de juego: Quiz, Código, Seguridad, Carrera Rápida, Sopa de Letras, Crucigrama, Drag & Drop
- Módulos separados por grado (los estudiantes solo ven el suyo)
- Ranking con tiers de color (Oro, Plata, Bronce, Elite, Pro, Novato)
- Sistema de mensajes directos entre docente y estudiantes
- Alertas y recomendaciones automáticas
- Panel del docente para crear retos personalizados

---

## Tecnologías usadas

| Capa | Tecnología |
|---|---|
| Frontend | React + TypeScript + Vite |
| Estilos | Tailwind CSS + shadcn/ui |
| Backend | Express + TypeScript |
| Base de datos | PostgreSQL + Drizzle ORM |
| Validación | Zod |
| Monorepo | pnpm workspaces |

---

## Requisitos previos

- Node.js 20 o superior
- pnpm (`npm install -g pnpm`)
- PostgreSQL corriendo localmente (o una URL de conexión)

---

## Cómo correr el proyecto localmente

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/cerebrito.git
cd cerebrito
```

### 2. Instalar dependencias
```bash
pnpm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
# Edita .env con tus valores reales
```

### 4. Crear las tablas en la base de datos
```bash
pnpm --filter @workspace/db run push
```

### 5. Correr el servidor API
```bash
pnpm --filter @workspace/api-server run dev
```

### 6. Correr el frontend (en otra terminal)
```bash
pnpm --filter @workspace/cerebrito run dev
```

La app estará disponible en `http://localhost:5173`

---

## Estructura del proyecto

```
cerebrito/
├── artifacts/
│   ├── infoquest/          # Frontend (React + Vite)
│   │   └── src/
│   │       ├── paginas/    # Páginas principales
│   │       ├── componentes/# Componentes reutilizables
│   │       └── contextos/  # AuthContext (sesión)
│   └── api-server/         # Backend (Express)
│       └── src/
│           ├── routes/     # Rutas de la API
│           └── lib/        # Auth y logger
├── lib/
│   └── db/                 # Esquema y configuración de la base de datos
└── pnpm-workspace.yaml
```

---

## Cuentas de prueba (solo desarrollo)

| Rol | Usuario | Contraseña |
|---|---|---|
| Docente | `docente1` | `123456` |
| Estudiante 1° | `ana_torres` | `123456` |
| Estudiante 2° | `luis_p` | `123456` |
| Estudiante 3° | `maria_s` | `123456` |

---

## Integrantes del proyecto

- _Agrega aquí los nombres del grupo_

## Institución

Colegio Nacional Cumbaya — Bachillerato en Informática
