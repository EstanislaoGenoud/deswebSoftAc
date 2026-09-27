import express from 'express';
import {
	getAllEscuelasController,
	getEscuelaByIdController,
	getCursosDeEscuelaController
} from '../controllers/escuelaController.js';

const router = express.Router();

/**
 * Rutas para la gestión y consulta de Escuelas (Departamentos Académicos).
 * HU-44: Asociar curso a una escuela (#105)
 * Tarea #106: Definir relación escuela-curso.
 */

// Catálogo general de escuelas con conteo de cursos
router.get('/', getAllEscuelasController);

// Ficha de una escuela específica
router.get('/:id', getEscuelaByIdController);

// Listado de cursos pertenecientes a la escuela (#106)
router.get('/:id/cursos', getCursosDeEscuelaController);

export default router;
