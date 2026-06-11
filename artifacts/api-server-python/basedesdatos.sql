USE cerebrito;


SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS perfiles (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  nombre                  VARCHAR(255),
  usuario                 VARCHAR(255) NOT NULL UNIQUE,
  password_hash           VARCHAR(255) NOT NULL,
  rol                     ENUM('estudiante','docente') NOT NULL DEFAULT 'estudiante',
  grado_bachillerato      INT,
  email                   VARCHAR(255),
  avatar_url              VARCHAR(500),
  puntos_totales          INT NOT NULL DEFAULT 0,
  racha_dias              INT NOT NULL DEFAULT 0,
  retos_completados       INT NOT NULL DEFAULT 0,
  ultimo_acceso           DATETIME,
  creado_en               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reset_token             VARCHAR(20),
  reset_token_expires_at  DATETIME,
  ultimo_nivel_intento    INT,
  mejor_puntaje_por_modulo JSON
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS modulos (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  nombre              VARCHAR(255) NOT NULL,
  anio_bachillerato   INT NOT NULL,
  descripcion         TEXT,
  color               VARCHAR(50),
  icono               VARCHAR(100),
  activo              TINYINT(1) NOT NULL DEFAULT 1,
  creado_en           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS niveles (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  id_modulo       INT NOT NULL,
  nombre          VARCHAR(255) NOT NULL,
  orden           INT NOT NULL DEFAULT 1,
  puntos_por_reto INT NOT NULL DEFAULT 100,
  activo          TINYINT(1) NOT NULL DEFAULT 1,
  creado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_modulo) REFERENCES modulos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS preguntas (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  id_modulo           INT NOT NULL,
  id_nivel            INT NOT NULL,
  tipo                ENUM('multiple','verdadero_falso','completar','codigo','ordenar') NOT NULL DEFAULT 'multiple',
  texto               TEXT NOT NULL,
  opciones            JSON,
  respuesta_correcta  VARCHAR(500) NOT NULL,
  explicacion         TEXT,
  dificultad          ENUM('facil','medio','dificil') NOT NULL DEFAULT 'medio',
  puntos              INT NOT NULL DEFAULT 10,
  activa              TINYINT(1) NOT NULL DEFAULT 1,
  creado_en           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_modulo) REFERENCES modulos(id),
  FOREIGN KEY (id_nivel)  REFERENCES niveles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS retos (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(255) NOT NULL,
  descripcion       TEXT,
  tipo_juego        ENUM('quiz','code_challenge','security_puzzle','drag_drop','speed_race','crossword','word_search') NOT NULL DEFAULT 'quiz',
  id_modulo         INT NOT NULL,
  id_nivel          INT NOT NULL,
  tiempo_limite     INT NOT NULL DEFAULT 300,
  puntos_maximos    INT NOT NULL DEFAULT 100,
  numero_preguntas  INT NOT NULL DEFAULT 10,
  activo            TINYINT(1) NOT NULL DEFAULT 1,
  creado_en         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_modulo) REFERENCES modulos(id),
  FOREIGN KEY (id_nivel)  REFERENCES niveles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS retos_personalizados (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  id_docente        INT NOT NULL,
  nombre            VARCHAR(255) NOT NULL,
  descripcion       TEXT,
  tipo_juego        ENUM('quiz','code_challenge','security_puzzle','drag_drop','speed_race','crossword','word_search') NOT NULL DEFAULT 'quiz',
  id_modulo         INT NOT NULL,
  id_nivel          INT NOT NULL,
  puntos_maximos    INT NOT NULL DEFAULT 100,
  numero_preguntas  INT NOT NULL DEFAULT 10,
  tiempo_limite     INT NOT NULL DEFAULT 300,
  activo            TINYINT(1) NOT NULL DEFAULT 1,
  publicado         TINYINT(1) NOT NULL DEFAULT 0,
  creado_en         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_docente) REFERENCES perfiles(id),
  FOREIGN KEY (id_modulo)  REFERENCES modulos(id),
  FOREIGN KEY (id_nivel)   REFERENCES niveles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS retos_personalizados_preguntas (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  id_reto             INT NOT NULL,
  id_pregunta         INT NOT NULL DEFAULT 0,
  texto               TEXT NOT NULL,
  tipo                ENUM('multiple','verdadero_falso','completar','codigo','ordenar') NOT NULL DEFAULT 'multiple',
  opciones            JSON,
  respuesta_correcta  VARCHAR(500) NOT NULL,
  explicacion         TEXT,
  dificultad          ENUM('facil','medio','dificil') NOT NULL DEFAULT 'medio',
  puntos              INT NOT NULL DEFAULT 10,
  creado_en           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_reto) REFERENCES retos_personalizados(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS resultados (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario              INT NOT NULL,
  id_reto                 INT NOT NULL,
  is_custom               TINYINT(1) NOT NULL DEFAULT 0,
  puntuacion              FLOAT NOT NULL DEFAULT 0,
  puntos_maximos          INT,
  `precision`             FLOAT NOT NULL DEFAULT 0,
  tiempo_total            INT NOT NULL DEFAULT 0,
  tiempo_respuesta        INT NOT NULL DEFAULT 0,
  respuestas_correctas    INT,
  respuestas_incorrectas  INT,
  detalles                JSON,
  completado              TINYINT(1) NOT NULL DEFAULT 1,
  fecha                   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES perfiles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS alertas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario  INT NOT NULL,
  descripcion TEXT NOT NULL,
  tipo        ENUM('bajo_rendimiento','nivel_completado','logro','sistema') NOT NULL DEFAULT 'sistema',
  leida       TINYINT(1) NOT NULL DEFAULT 0,
  fecha       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES perfiles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS recomendaciones (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario  INT NOT NULL,
  descripcion TEXT NOT NULL,
  motivo      VARCHAR(255),
  tipo        VARCHAR(100),
  leida       TINYINT(1) NOT NULL DEFAULT 0,
  fecha       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES perfiles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS feedback_docente (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  id_docente      INT NOT NULL,
  id_estudiante   INT NOT NULL,
  contenido       TEXT NOT NULL,
  tipo            ENUM('mejora','felicitacion','advertencia','general') NOT NULL DEFAULT 'general',
  leido           TINYINT(1) NOT NULL DEFAULT 0,
  creado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_docente)    REFERENCES perfiles(id),
  FOREIGN KEY (id_estudiante) REFERENCES perfiles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS intentos_guardados (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario          INT NOT NULL,
  id_reto             INT NOT NULL,
  progreso_json       JSON,
  pregunta_actual     INT NOT NULL DEFAULT 0,
  puntuacion_parcial  INT NOT NULL DEFAULT 0,
  actualizado_en      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES perfiles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mensajes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  id_remitente    INT NOT NULL,
  id_destinatario INT NOT NULL,
  contenido       TEXT NOT NULL,
  leido           TINYINT(1) NOT NULL DEFAULT 0,
  creado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_remitente)    REFERENCES perfiles(id),
  FOREIGN KEY (id_destinatario) REFERENCES perfiles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sesiones_competencia (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  codigo      VARCHAR(10) NOT NULL UNIQUE,
  nombre      VARCHAR(255) NOT NULL,
  id_reto     INT NOT NULL,
  id_docente  INT NOT NULL,
  activa      TINYINT(1) NOT NULL DEFAULT 1,
  creado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_reto)    REFERENCES retos(id),
  FOREIGN KEY (id_docente) REFERENCES perfiles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS participantes_sesion (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  id_sesion             INT NOT NULL,
  id_usuario            INT NOT NULL,
  puntuacion            FLOAT NOT NULL DEFAULT 0,
  tiempo_total          INT,
  respuestas_correctas  INT NOT NULL DEFAULT 0,
  total_preguntas       INT NOT NULL DEFAULT 0,
  completado            TINYINT(1) NOT NULL DEFAULT 0,
  unido_en              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_sesion)  REFERENCES sesiones_competencia(id),
  FOREIGN KEY (id_usuario) REFERENCES perfiles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
y