import express from 'express';
import {
	getAllCursosController,
	getCursosDocenteController,
	getCursosByDocenteIdController,
	getCursoByIdController,
	getCursoDetalleController,
	getEscuelaCursoController,
	getAlumnosCursoController,
	getCapacidadCursoController,
	inscribirAlumnoCursoController,
	desinscribirAlumnoCursoController,
	asociarEscuelaController,
	createCursoController,
	updateCursoController,
	deleteCursoController
} from '../controllers/cursoController.js';
import { verifyToken, optionalVerifyToken } from '../middlewares/authToken.middleware.js';
import {
	validateCurso,
	validateAsociacionEscuela,
	validateInscripcionAlumno
} from '../middlewares/validate.middleware.js';

const router = express.Router();

// HU-04 #79: Obtener cursos asociados al docente autenticado (vía JWT)
router.get('/mis-cursos', verifyToken, getCursosDocenteController);
router.get('/docente', verifyToken, getCursosDocenteController);

// Rutas de consulta pública / general de cursos (soporta paginación, filtros y búsqueda dinámica)
router.get('/', getAllCursosController);
router.get('/docente/:docenteId', getCursosByDocenteIdController);

// HU-06: Consultar información del curso (#96)
// #97: Endpoint de detalle con escuela (#99) y cantidad de alumnos (#101)
router.get('/:id/detalle', optionalVerifyToken, getCursoDetalleController);
// #99: Endpoint específico de escuela asociada
router.get('/:id/escuela', getEscuelaCursoController);
// #101 & #104: Listado de alumnos inscriptos con validación estricta de permisos
router.get('/:id/alumnos', verifyToken, getAlumnosCursoController);

// HU-45: Registrar cantidad de alumnos del curso (#112)
// #113 & #114: Consulta y visualización de cantidad de alumnos y capacidad
router.get('/:id/capacidad', getCapacidadCursoController);
router.get('/:id/cantidad-alumnos', getCapacidadCursoController);
// #115: Inscribir alumno con actualización automática de cantidad y cupo
router.post('/:id/alumnos', verifyToken, validateInscripcionAlumno, inscribirAlumnoCursoController);
// #115: Eliminar alumno con actualización automática de cantidad y cupo
router.delete('/:id/alumnos/:alumnoId', verifyToken, desinscribirAlumnoCursoController);

// Ficha básica de curso
router.get('/:id', getCursoByIdController);

// HU-44 #108: Asociar curso a una escuela
router.put('/:id/escuela', verifyToken, validateAsociacionEscuela, asociarEscuelaController);
router.patch('/:id/escuela', verifyToken, validateAsociacionEscuela, asociarEscuelaController);

// Rutas protegidas con validación de datos y verificación de propiedad
router.post('/', verifyToken, validateCurso, createCursoController);
router.put('/:id', verifyToken, validateCurso, updateCursoController);
router.delete('/:id', verifyToken, deleteCursoController);

export default router;



