-- ==========================================================
-- SCRIPT DE BASE DE DATOS: Sistema de Gestión Académico
-- Requerimientos de Seguridad, Integridad Referencial y Recursos
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `api3` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `api3`;

-- ----------------------------------------------------------
-- 1. TABLA: usuarios
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `contrasena` VARCHAR(255) NOT NULL,
  `rol_id` INT DEFAULT 1,
  `activo` TINYINT(1) DEFAULT 1,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 2. TABLA: publicaciones (Recurso generado por usuarios)
-- Integridad: autor_id es Clave Foránea con ON DELETE RESTRICT
-- Protección: Evita eliminar al usuario si posee publicaciones activas.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `publicaciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titulo` VARCHAR(200) NOT NULL,
  `contenido` TEXT NOT NULL,
  `autor_id` INT NOT NULL,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_publicaciones_autor` (`autor_id`),
  INDEX `idx_publicaciones_titulo` (`titulo`),
  CONSTRAINT `fk_publicaciones_autor`
    FOREIGN KEY (`autor_id`)
    REFERENCES `usuarios` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 3. TABLA: escuelas (Facultades / Departamentos Académicos - HU-06 #99)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `escuelas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo` VARCHAR(50) NOT NULL UNIQUE,
  `nombre` VARCHAR(150) NOT NULL,
  `director` VARCHAR(150),
  `email_contacto` VARCHAR(150),
  `ubicacion` VARCHAR(150),
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_escuelas_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 4. TABLA: cursos (Gestión de Cursos y Asignaciones de Docentes)
-- Integridad: docente_id y escuela_id son Claves Foráneas
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cursos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo` VARCHAR(50) NOT NULL UNIQUE,
  `nombre` VARCHAR(150) NOT NULL,
  `descripcion` TEXT,
  `docente_id` INT NOT NULL,
  `escuela_id` INT DEFAULT 1,
  `comision` VARCHAR(50) DEFAULT 'Comisión A',
  `periodo` VARCHAR(50) DEFAULT '2026 - 1° Cuatrimestre',
  `aula` VARCHAR(50) DEFAULT 'Aula Virtual',
  `horario` VARCHAR(100) DEFAULT 'Lunes y Miércoles 18:30 - 21:30',
  `cupo_maximo` INT DEFAULT 35,
  `activo` TINYINT(1) DEFAULT 1,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_cursos_docente` (`docente_id`),
  INDEX `idx_cursos_escuela` (`escuela_id`),
  INDEX `idx_cursos_codigo` (`codigo`),
  INDEX `idx_cursos_nombre` (`nombre`),
  CONSTRAINT `fk_cursos_docente`
    FOREIGN KEY (`docente_id`)
    REFERENCES `usuarios` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_cursos_escuela`
    FOREIGN KEY (`escuela_id`)
    REFERENCES `escuelas` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- ----------------------------------------------------------
-- 5. TABLA: inscripciones (Matriculación de Alumnos - HU-06 #101)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `inscripciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `curso_id` INT NOT NULL,
  `alumno_id` INT NOT NULL,
  `estado` ENUM('inscripto', 'regular', 'promocionado', 'libre') DEFAULT 'inscripto',
  `fecha_inscripcion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_inscripciones_curso` (`curso_id`),
  INDEX `idx_inscripciones_alumno` (`alumno_id`),
  UNIQUE KEY `uk_curso_alumno` (`curso_id`, `alumno_id`),
  CONSTRAINT `fk_inscripciones_curso`
    FOREIGN KEY (`curso_id`)
    REFERENCES `cursos` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_inscripciones_alumno`
    FOREIGN KEY (`alumno_id`)
    REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 6. TABLA: evaluaciones (Instancias Evaluativas de Cursos - HU-09 #146)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `evaluaciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `curso_id` INT NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `tipo` ENUM('parcial', 'tp', 'final', 'recuperatorio') DEFAULT 'parcial',
  `fecha_evaluacion` DATE,
  `ponderacion` INT DEFAULT 50,
  `criterio_aprobacion` DECIMAL(4,2) DEFAULT 4.00,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_evaluaciones_curso` (`curso_id`),
  CONSTRAINT `fk_evaluaciones_curso`
    FOREIGN KEY (`curso_id`)
    REFERENCES `cursos` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 7. TABLA: calificaciones (Notas de Alumnos - HU-09 #145)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `calificaciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `evaluacion_id` INT NOT NULL,
  `alumno_id` INT NOT NULL,
  `nota` DECIMAL(4,2) NOT NULL,
  `observaciones` VARCHAR(255),
  `fecha_calificacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_calificaciones_evaluacion` (`evaluacion_id`),
  INDEX `idx_calificaciones_alumno` (`alumno_id`),
  UNIQUE KEY `uk_evaluacion_alumno` (`evaluacion_id`, `alumno_id`),
  CONSTRAINT `fk_calificaciones_evaluacion`
    FOREIGN KEY (`evaluacion_id`)
    REFERENCES `evaluaciones` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_calificaciones_alumno`
    FOREIGN KEY (`alumno_id`)
    REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- DATOS INICIALES DE PRUEBA (Semillas / Seeds)
-- Contraseñas hasheadas con bcrypt para 'Admin123!' y 'User123!'
-- ----------------------------------------------------------
INSERT INTO `escuelas` (`id`, `codigo`, `nombre`, `director`, `email_contacto`, `ubicacion`)
VALUES
(1, 'ESC-INF', 'Escuela de Informática y Tecnología', 'Dr. Roberto Gómez', 'informatica@instituto.edu.ar', 'Edificio Tecnológico - Campus Norte'),
(2, 'ESC-ING', 'Escuela de Ingeniería de Software', 'Ing. Patricia Rossi', 'ingenieria@instituto.edu.ar', 'Edificio B - Planta Alta')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

INSERT INTO `usuarios` (`id`, `nombre`, `apellido`, `email`, `contrasena`, `rol_id`, `activo`) 
VALUES 
(1, 'Admin', 'Sistema', 'admin@instituto.edu.ar', '$2b$10$Q73hQyLq3K0jH9X11k1xEOZzL11hZpA1y5vHnJqY7Wv0.2B0k9eGy', 2, 1),
(2, 'Juan', 'Perez', 'juan.perez@instituto.edu.ar', '$2b$10$Q73hQyLq3K0jH9X11k1xEOZzL11hZpA1y5vHnJqY7Wv0.2B0k9eGy', 2, 1),
(3, 'Maria', 'Gomez', 'maria.gomez@instituto.edu.ar', '$2b$10$Q73hQyLq3K0jH9X11k1xEOZzL11hZpA1y5vHnJqY7Wv0.2B0k9eGy', 2, 1),
(4, 'Lucas', 'Martínez', 'lucas.martinez@instituto.edu.ar', '$2b$10$Q73hQyLq3K0jH9X11k1xEOZzL11hZpA1y5vHnJqY7Wv0.2B0k9eGy', 1, 1),
(5, 'Camila', 'Álvarez', 'camila.alvarez@instituto.edu.ar', '$2b$10$Q73hQyLq3K0jH9X11k1xEOZzL11hZpA1y5vHnJqY7Wv0.2B0k9eGy', 1, 1),
(6, 'Mateo', 'Fernández', 'mateo.fernandez@instituto.edu.ar', '$2b$10$Q73hQyLq3K0jH9X11k1xEOZzL11hZpA1y5vHnJqY7Wv0.2B0k9eGy', 1, 1)
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

INSERT INTO `publicaciones` (`id`, `titulo`, `contenido`, `autor_id`)
VALUES
(1, 'Bienvenida al Ciclo Lectivo 2026', 'Les damos la bienvenida a todos los estudiantes de Desarrollo de Sistemas Web.', 1),
(2, 'Guía de Prácticas: APIs REST Seguras', 'Material complementario sobre JWT, RegEx y consultas SQL parametrizadas.', 1),
(3, 'Consulta sobre Trabajo Práctico', 'Quisiera consultar sobre la implementación de TDD en Jest.', 2)
ON DUPLICATE KEY UPDATE `titulo` = VALUES(`titulo`);

INSERT INTO `cursos` (`id`, `codigo`, `nombre`, `descripcion`, `docente_id`, `escuela_id`, `comision`, `periodo`, `aula`, `horario`, `cupo_maximo`, `activo`)
VALUES
(1, 'DSW-301', 'Desarrollo de Sistemas Web', 'Arquitectura cliente-servidor, APIs REST, autenticación JWT, Express y MySQL.', 1, 1, 'Comisión A', '2026 - 1° Cuatrimestre', 'Lab 3 - Informática', 'Lunes y Miércoles 18:30 - 21:30', 30, 1),
(2, 'BD-201', 'Bases de Datos Avanzadas', 'Diseño relacional, optimización de consultas SQL, transacciones e integridad.', 1, 1, 'Comisión B', '2026 - 1° Cuatrimestre', 'Aula Magna 2', 'Martes y Jueves 19:00 - 22:00', 40, 1),
(3, 'ING-202', 'Ingeniería de Software I', 'Metodologías ágiles, historias de usuario, requerimientos y testing automatizado.', 1, 2, 'Comisión A', '2026 - 2° Cuatrimestre', 'Lab 1', 'Sábados 09:00 - 13:00', 25, 1),
(4, 'AYED-101', 'Algoritmos y Estructuras de Datos', 'Estructuras de datos fundamentales, grafos, árboles y análisis de complejidad.', 2, 1, 'Comisión C', '2026 - 1° Cuatrimestre', 'Aula 104', 'Viernes 14:00 - 18:00', 35, 1),
(5, 'PROG-101', 'Programación I', 'Fundamentos de programación estructurada, algoritmos y estructuras de control.', 2, 1, 'Comisión A', '2025 - 1° Cuatrimestre', 'Aula 102', 'Lunes y Jueves 18:00 - 21:00', 40, 1),
(6, 'ARQ-102', 'Arquitectura de Computadoras', 'Organización de computadoras, procesadores, memorias y lenguaje ensamblador.', 1, 1, 'Comisión B', '2025 - 2° Cuatrimestre', 'Lab Hardware', 'Martes y Viernes 18:00 - 21:00', 35, 1)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

INSERT INTO `inscripciones` (`id`, `curso_id`, `alumno_id`, `estado`)
VALUES
(1, 1, 4, 'inscripto'),
(2, 1, 5, 'inscripto'),
(3, 1, 6, 'inscripto'),
(4, 2, 4, 'inscripto'),
(5, 2, 5, 'inscripto'),
(6, 4, 4, 'inscripto'),
(7, 5, 4, 'promocionado'),
(8, 6, 4, 'regular'),
(9, 5, 5, 'promocionado'),
(10, 6, 5, 'promocionado')
ON DUPLICATE KEY UPDATE `estado` = VALUES(`estado`);

INSERT INTO `evaluaciones` (`id`, `curso_id`, `nombre`, `tipo`, `fecha_evaluacion`, `ponderacion`, `criterio_aprobacion`)
VALUES
(1, 1, 'Primer Examen Parcial (Arquitectura y APIs)', 'parcial', '2026-05-10', 40, 4.00),
(2, 1, 'Trabajo Práctico N° 1 (Testing Automatizado)', 'tp', '2026-06-01', 30, 4.00),
(3, 1, 'Segundo Examen Parcial (Seguridad y JWT)', 'parcial', '2026-06-25', 30, 4.00),
(4, 2, 'Evaluación Parcial de SQL y Normalización', 'parcial', '2026-05-18', 50, 4.00),
(5, 2, 'Proyecto de Integridad y Procedimientos', 'tp', '2026-06-15', 50, 4.00),
(6, 5, 'Examen Final de Programación I', 'final', '2025-07-08', 100, 4.00),
(7, 6, 'Examen Final de Arquitectura de Computadoras', 'final', '2025-12-12', 100, 4.00)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

INSERT INTO `calificaciones` (`id`, `evaluacion_id`, `alumno_id`, `nota`, `observaciones`)
VALUES
(1, 1, 4, 8.50, 'Excelente comprensión de arquitectura MVC y middlewares'),
(2, 2, 4, 9.00, 'Suite de pruebas en Jest completa con 100% coverage'),
(3, 1, 5, 7.00, 'Buen desarrollo, revisar manejo de errores asíncronos'),
(4, 4, 4, 8.00, 'Correcta diagramación relacional y normalización 3FN'),
(5, 4, 5, 6.50, 'Aprobado, ajustar índices y claves foráneas'),
(6, 6, 4, 9.50, 'Promoción destacada en Programación I'),
(7, 7, 4, 7.50, 'Aprobación en instancia regular de Arquitectura'),
(8, 6, 5, 8.50, 'Promoción directa en Programación I')
ON DUPLICATE KEY UPDATE `nota` = VALUES(`nota`);



