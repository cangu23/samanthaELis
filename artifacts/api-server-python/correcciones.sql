USE cerebrito;

ALTER TABLE perfiles 
  ADD COLUMN cedula VARCHAR(20) UNIQUE AFTER nombre;

ALTER TABLE perfiles 
  ADD CONSTRAINT uq_email UNIQUE (email);

ALTER TABLE perfiles 
  MODIFY COLUMN reset_token VARCHAR(100);

DROP TABLE IF EXISTS mensajes;

ALTER TABLE sesiones_competencia
  ADD COLUMN estado ENUM('esperando','en_progreso','finalizada') NOT NULL DEFAULT 'esperando',
  ADD COLUMN iniciada_en DATETIME DEFAULT NULL,
  ADD COLUMN finalizada_en DATETIME DEFAULT NULL;