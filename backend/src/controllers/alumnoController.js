import {
	obtenerAlumnosService,
	buscarAlumnosService,
	obtenerMisAlumnosDocenteService,
	obtenerAlumnosPorCursoService,
	obtenerPerfilAlumnoService,
	obtenerCalificacionesAlumnoService,
	obtenerEvaluacionesAlumnoService,
	obtenerResumenAcademicoService,
	obtenerHistorialAcademicoService
} from '../services/alumnoService.js';

/**
 * Capa de Controladores: Módulo Alumnos
 * (HU-07: Visualizar listado #118, HU-08: Buscar alumno #130, HU-09: Perfil #139, HU-10: Historial #151).
 */

/**
 * HU-07 #121 & #122: Obtiene el listado de todos los alumnos con soporte para
 * búsqueda dinámica (search), paginación (page, limit) y filtros (curso_id, docente_id, estado).
 */
export const getAllAlumnosController = async (req, res) => {
	try {
		const result = await obtenerAlumnosService(req.query);
		res.status(200).json(result);
	} catch (error) {
		console.error('Error al obtener listado de alumnos:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * HU-08 #131, #136, #137: Controlador para búsqueda y filtrado avanzado de alumnos.
 * Soporta parámetros search / q, filtros específicos por nombre, apellido, legajo, email,
 * curso_id, docente_id, escuela_id, estado, periodo, promedios, desempeno y ordenamiento.
 */
export const buscarAlumnosController = async (req, res) => {
	try {
		const result = await buscarAlumnosService(req.query);
		res.status(200).json(result);
	} catch (error) {
		console.error('Error en la búsqueda de alumnos:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * HU-07 #120 & #121: Obtiene los alumnos inscriptos en cursos dictados por el docente autenticado.
 * Extrae de forma segura el ID del docente desde el token JWT (req.usuario.id).
 */
export const getMisAlumnosController = async (req, res) => {
	try {
		const docenteId = req.usuario?.id;
		if (!docenteId) {
			return res.status(401).json({
				error: 'No autenticado',
				message: 'No se pudo determinar la identidad del docente a partir del token'
			});
		}

		const { search, curso_id, estado, page, limit } = req.query;
		const result = await obtenerMisAlumnosDocenteService(docenteId, { search, curso_id, estado, page, limit });

		res.status(200).json({
			...result,
			docente_id: docenteId
		});
	} catch (error) {
		console.error('Error al obtener alumnos del docente autenticado:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * HU-07 #120: Obtiene los alumnos inscriptos en un curso específico por su ID.
 */
export const getAlumnosByCursoController = async (req, res) => {
	try {
		const { cursoId } = req.params;
		const { search, estado, page, limit } = req.query;
		const result = await obtenerAlumnosPorCursoService(cursoId, { search, estado, page, limit });
		res.status(200).json(result);
	} catch (error) {
		console.error('Error al obtener alumnos por curso:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};


/**
 * HU-09 #140: Obtiene el perfil del alumno autenticado (extraído directamente desde el JWT).
 */
export const getMiPerfilAlumnoController = async (req, res) => {
	try {
		const alumnoId = req.usuario?.id;
		if (!alumnoId) {
			return res.status(401).json({
				error: 'No autenticado',
				message: 'No se pudo determinar la identidad del alumno a partir del token'
			});
		}

		const result = await obtenerPerfilAlumnoService(alumnoId, req.usuario);
		if (!result.success) {
			return res.status(result.status).json({
				error: result.error,
				message: result.message
			});
		}

		res.status(200).json(result.data);
	} catch (error) {
		console.error('Error al obtener mi perfil de alumno:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * HU-09 #140: Obtiene el perfil consolidado de un alumno por su ID (con control de acceso #150).
 */
export const getPerfilAlumnoController = async (req, res) => {
	try {
		const { id } = req.params;
		const result = await obtenerPerfilAlumnoService(id, req.usuario);

		if (!result.success) {
			return res.status(result.status).json({
				error: result.error,
				message: result.message
			});
		}

		res.status(200).json(result.data);
	} catch (error) {
		console.error('Error al obtener perfil del alumno:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * HU-09 #145: Obtiene las calificaciones registradas de un alumno.
 */
export const getCalificacionesAlumnoController = async (req, res) => {
	try {
		const { id } = req.params;
		const result = await obtenerCalificacionesAlumnoService(id, req.usuario);

		if (!result.success) {
			return res.status(result.status).json({
				error: result.error,
				message: result.message
			});
		}

		res.status(200).json(result.data);
	} catch (error) {
		console.error('Error al obtener calificaciones del alumno:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * HU-09 #146: Obtiene las evaluaciones programadas y rendidas de un alumno.
 */
export const getEvaluacionesAlumnoController = async (req, res) => {
	try {
		const { id } = req.params;
		const result = await obtenerEvaluacionesAlumnoService(id, req.usuario);

		if (!result.success) {
			return res.status(result.status).json({
				error: result.error,
				message: result.message
			});
		}

		res.status(200).json(result.data);
	} catch (error) {
		console.error('Error al obtener evaluaciones del alumno:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * HU-09 #149: Obtiene el resumen académico y métricas de desempeño de un alumno.
 */
export const getResumenAcademicoController = async (req, res) => {
	try {
		const { id } = req.params;
		const result = await obtenerResumenAcademicoService(id, req.usuario);

		if (!result.success) {
			return res.status(result.status).json({
				error: result.error,
				message: result.message
			});
		}

		res.status(200).json(result.data);
	} catch (error) {
		console.error('Error al obtener resumen académico del alumno:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * HU-10 #154: Obtiene el historial académico completo del alumno autenticado (extraído desde JWT).
 */
export const getMiHistorialAcademicoController = async (req, res) => {
	try {
		const alumnoId = req.usuario?.id;
		if (!alumnoId) {
			return res.status(401).json({
				error: 'No autenticado',
				message: 'No se pudo determinar la identidad del alumno a partir del token'
			});
		}

		const { periodo, estado, curso_id } = req.query;
		const result = await obtenerHistorialAcademicoService(alumnoId, req.usuario, { periodo, estado, curso_id });

		if (!result.success) {
			return res.status(result.status).json({
				error: result.error,
				message: result.message
			});
		}

		res.status(200).json(result.data);
	} catch (error) {
		console.error('Error al obtener mi historial académico:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * HU-10 #154: Obtiene el historial académico de un alumno por ID (cursos anteriores, actuales y calificaciones).
 * Control de acceso: permitido al propio alumno, sus docentes asignados o administradores (#150).
 */
export const getHistorialAcademicoController = async (req, res) => {
	try {
		const { id } = req.params;
		const { periodo, estado, curso_id } = req.query;
		const result = await obtenerHistorialAcademicoService(id, req.usuario, { periodo, estado, curso_id });

		if (!result.success) {
			return res.status(result.status).json({
				error: result.error,
				message: result.message
			});
		}

		res.status(200).json(result.data);
	} catch (error) {
		console.error('Error al obtener historial académico del alumno:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

