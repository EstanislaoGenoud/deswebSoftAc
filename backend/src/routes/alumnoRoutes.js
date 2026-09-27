import express from 'express';
import {
	getAllAlumnosController,
	buscarAlumnosController,
	getMisAlumnosController,
	getAlumnosByCursoController,
	getMiPerfilAlumnoController,
	getPerfilAlumnoController,
	getCalificacionesAlumnoController,
	getEvaluacionesAlumnoController,
	getResumenAcademicoController,
	getMiHistorialAcademicoController,
	getHistorialAcademicoController
} from '../controllers/alumnoController.js';
import { verifyToken } from '../middlewares/authToken.middleware.js';

const router = express.Router();

/**
 * HU-07: Visualizar listado de alumnos (#118)
 * - #119: Modelo de alumno
 * - #120: Relación alumno-curso
 * - #121: Endpoint de alumnos
 * - #122: Implementar listado
 * - #127: Acceso al perfil
 */

// #121 & #122: Listado general de alumnos (paginación, búsqueda dinámica, filtros)
router.get('/', getAllAlumnosController);

/**
 * HU-08: Buscar alumno (#130)
 * - #131: Crear parámetro de búsqueda (search, q, nombre, apellido, legajo, email)
 * - #136: Implementar filtrado (curso_id, docente_id, escuela_id, estado, periodo, promedios, ordenamiento)
 * - #137: Manejar resultados vacíos
 */
router.get('/buscar', buscarAlumnosController);

// #120 & #121: Alumnos asignados al docente autenticado (vía JWT)
router.get('/mis-alumnos', verifyToken, getMisAlumnosController);

// #120: Alumnos inscriptos en un curso específico
router.get('/curso/:cursoId', getAlumnosByCursoController);

/**
 * HU-10: Consultar historial académico (#151)
 * - #153: Relación alumno -> cursos anteriores
 * - #154: Endpoint de historial
 * - #159: Probar consulta
 */

// #154: Mi historial académico de alumno autenticado
router.get('/mi-historial', verifyToken, getMiHistorialAcademicoController);

/**
 * HU-09: Consultar perfil del alumno (#139)
 * Rutas protegidas con verifyToken y validación estricta de permisos (#150).
 */

// #140: Mi perfil de alumno autenticado
router.get('/mi-perfil', verifyToken, getMiPerfilAlumnoController);

// #154: Historial académico de un alumno por ID (cursos anteriores, actuales y calificaciones)
router.get('/:id/historial-academico', verifyToken, getHistorialAcademicoController);
router.get('/:id/historial', verifyToken, getHistorialAcademicoController);

// #140: Perfil completo por ID de alumno
router.get('/:id/perfil', verifyToken, getPerfilAlumnoController);
router.get('/:id', verifyToken, getPerfilAlumnoController);

// #145: Calificaciones del alumno
router.get('/:id/calificaciones', verifyToken, getCalificacionesAlumnoController);

// #146: Evaluaciones programadas y rendidas
router.get('/:id/evaluaciones', verifyToken, getEvaluacionesAlumnoController);

// #149: Resumen académico y promedio general
router.get('/:id/resumen-academico', verifyToken, getResumenAcademicoController);

export default router;

