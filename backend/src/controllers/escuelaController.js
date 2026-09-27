import {
	obtenerEscuelasService,
	obtenerEscuelaPorIdService,
	obtenerCursosPorEscuelaService,
	asociarCursoAEscuelaService
} from '../services/escuelaService.js';

/**
 * Controlador para la entidad Escuelas (Departamentos / Facultades).
 * HU-44: Asociar curso a una escuela (#105)
 * Tareas: #106, #108, #109.
 */

/**
 * Obtiene el catálogo completo de escuelas con estadísticas (#106).
 */
export const getAllEscuelasController = async (req, res) => {
	try {
		const result = await obtenerEscuelasService();
		res.status(200).json(result);
	} catch (error) {
		console.error('Error al obtener escuelas:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * Obtiene el detalle de una escuela por su ID (#106).
 */
export const getEscuelaByIdController = async (req, res) => {
	try {
		const { id } = req.params;
		const result = await obtenerEscuelaPorIdService(id);

		if (!result.success) {
			return res.status(result.status).json({
				error: result.error,
				message: result.message
			});
		}

		res.status(200).json(result.data);
	} catch (error) {
		console.error('Error al obtener escuela por ID:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * Obtiene todos los cursos pertenecientes a una escuela específica (#106).
 */
export const getCursosDeEscuelaController = async (req, res) => {
	try {
		const { id } = req.params;
		const { search, page, limit, activo } = req.query;

		const result = await obtenerCursosPorEscuelaService(id, { search, page, limit, activo });

		if (!result.success) {
			return res.status(result.status).json({
				error: result.error,
				message: result.message
			});
		}

		res.status(200).json(result);
	} catch (error) {
		console.error('Error al obtener cursos de la escuela:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * Asocia un curso a una escuela (HU-44 #108).
 * Valida pertenencia de escuela (#109) y permisos de docente titular o admin (#104).
 */
export const asociarCursoEscuelaController = async (req, res) => {
	try {
		const { id } = req.params; // Curso ID
		const { escuela_id } = req.body;

		const result = await asociarCursoAEscuelaService({
			cursoId: id,
			escuelaId: escuela_id,
			usuarioAutenticado: req.usuario
		});

		if (!result.success) {
			return res.status(result.status).json({
				error: result.error,
				message: result.message
			});
		}

		res.status(200).json(result);
	} catch (error) {
		console.error('Error al asociar curso a escuela:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};
