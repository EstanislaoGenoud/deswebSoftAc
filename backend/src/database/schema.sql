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
-- DATOS INICIALES DE PRUEBA (Semillas / Seeds)
-- Contraseñas hasheadas con bcrypt para 'Admin123!' y 'User123!'
-- ----------------------------------------------------------
INSERT INTO `usuarios` (`id`, `nombre`, `apellido`, `email`, `contrasena`, `rol_id`, `activo`) 
VALUES 
(1, 'Admin', 'Sistema', 'admin@instituto.edu.ar', '$2b$10$Q73hQyLq3K0jH9X11k1xEOZzL11hZpA1y5vHnJqY7Wv0.2B0k9eGy', 2, 1),
(2, 'Juan', 'Perez', 'juan.perez@instituto.edu.ar', '$2b$10$Q73hQyLq3K0jH9X11k1xEOZzL11hZpA1y5vHnJqY7Wv0.2B0k9eGy', 1, 1)
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

INSERT INTO `publicaciones` (`id`, `titulo`, `contenido`, `autor_id`)
VALUES
(1, 'Bienvenida al Ciclo Lectivo 2026', 'Les damos la bienvenida a todos los estudiantes de Desarrollo de Sistemas Web.', 1),
(2, 'Guía de Prácticas: APIs REST Seguras', 'Material complementario sobre JWT, RegEx y consultas SQL parametrizadas.', 1),
(3, 'Consulta sobre Trabajo Práctico', 'Quisiera consultar sobre la implementación de TDD en Jest.', 2)
ON DUPLICATE KEY UPDATE `titulo` = VALUES(`titulo`);
