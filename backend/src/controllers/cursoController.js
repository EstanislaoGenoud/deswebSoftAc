import {
	crearCursoService,
	obtenerCursosService,
	obtenerCursosDocenteService,
	obtenerCursoPorIdService,
	obtenerCursoDetalleService,
	obtenerEscuelaDeCursoService,
	obtenerAlumnosCursoService,
	obtenerCapacidadYAlumnosCursoService,
	inscribirAlumnoCursoService,
	desinscribirAlumnoCursoService,
	asociarCursoAEscuelaService,
	actualizarCursoService,
	eliminarCursoService
} from '../services/cursoService.js';


/**
 * Obtiene el listado de todos los cursos con soporte para
 * búsqueda dinámica (search), paginación (page, limit) y filtros (docente_id, activo).
 */
export const getAllCursosController = async (req, res) => {
	try {
		const { search, docente_id, page, limit, activo } = req.query;
		const result = await obtenerCursosService({ search, docente_id, page, limit, activo });
		res.status(200).json(result);
	} catch (error) {
		console.error('Error al obtener cursos:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * Obtiene los cursos asignados exclusivamente al docente autenticado.
 * SEGURIDAD Y PROPIEDAD: Extrae el ID del docente directamente del token JWT (req.usuario.id).
 * Previene acceso indebido o manipulación de parámetros (BOLA / IDOR).
 */
export const getCursosDocenteController = async (req, res) => {
	try {
		const docenteId = req.usuario?.id;

		if (!docenteId) {
			return res.status(401).json({
				error: 'No autenticado',
				message: 'No se pudo determinar la identidad del docente a partir del token'
			});
		}

		const { search, page, limit, activo } = req.query;
		const result = await obtenerCursosDocenteService(docenteId, { search, page, limit, activo });

		res.status(200).json({
			...result,
			docente_id: docenteId
		});
	} catch (error) {
		console.error('Error al obtener cursos del docente autenticado:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * Obtiene los cursos asignados a un docente específico según su ID por parámetro.
 */
export const getCursosByDocenteIdController = async (req, res) => {
	try {
		const { docenteId } = req.params;
		const { search, page, limit, activo } = req.query;

		const result = await obtenerCursosDocenteService(docenteId, { search, page, limit, activo });
		res.status(200).json(result);
	} catch (error) {
		console.error('Error al obtener cursos por ID de docente:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * Obtiene el detalle de un curso por su ID.
 */
export const getCursoByIdController = async (req, res) => {
	try {
		const { id } = req.params;
		const result = await obtenerCursoPorIdService(id);

		if (!result.success) {
			return res.status(result.status).json({
				error: result.error,
				message: result.message
			});
		}

		res.status(200).json(result.curso);
	} catch (error) {
		console.error('Error al obtener curso por ID:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * HU-06 #97: Obtiene la información detallada completa de un curso,
 * incluyendo escuela asociada (#99), cantidad de alumnos inscriptos (#101),
 * cupos disponibles, porcentaje de ocupación y cálculo de permisos (#104).
 */
export const getCursoDetalleController = async (req, res) => {
	try {
		const { id } = req.params;
		const result = await obtenerCursoDetalleService(id, req.usuario);

		if (!result.success) {
			return res.status(result.status).json({
				error: result.error,
				message: result.message
			});
		}

		res.status(200).json(result.curso);
	} catch (error) {
		console.error('Error al obtener detalle de curso:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * HU-06 #99: Obtiene la escuela asociada al curso por su ID.
 */
export const getEscuelaCursoController = async (req, res) => {
	try {
		const { id } = req.params;
		const result = await obtenerEscuelaDeCursoService(id);

		if (!result.success) {
			return res.status(result.status).json({
				error: result.error,
				message: result.message
			});
		}

		res.status(200).json(result);
	} catch (error) {
		console.error('Error al obtener escuela del curso:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * HU-06 #101 & #104: Obtiene el listado de alumnos inscriptos y estadísticas de cupo.
 * SEGURIDAD Y PERMISOS (#104): Valida que la petición provenga del docente titular o administrador.
 */
export const getAlumnosCursoController = async (req, res) => {
	try {
		const { id } = req.params;
		const result = await obtenerAlumnosCursoService({
			cursoId: id,
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
		console.error('Error al obtener alumnos del curso:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * HU-44 #108: Asocia un curso a una escuela académica.
 * Valida permisos (#104) y existencia de la escuela (#109).
 */
export const asociarEscuelaController = async (req, res) => {
	try {
		const { id } = req.params;
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
		console.error('Error al asociar escuela al curso:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * HU-45 #113 & #114: Consulta y muestra la capacidad y cantidad de alumnos de un curso.
 */
export const getCapacidadCursoController = async (req, res) => {
	try {
		const { id } = req.params;
		const result = await obtenerCapacidadYAlumnosCursoService(id);

		if (!result.success) {
			return res.status(result.status).json({
				error: result.error,
				message: result.message
			});
		}

		res.status(200).json(result.data);
	} catch (error) {
		console.error('Error al obtener capacidad del curso:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * HU-45 #115: Inscribe un alumno en el curso y actualiza automáticamente la cantidad y cupo disponible.
 */
export const inscribirAlumnoCursoController = async (req, res) => {
	try {
		const { id } = req.params;
		const { alumno_id, estado } = req.body;

		const result = await inscribirAlumnoCursoService({
			cursoId: id,
			alumnoId: alumno_id,
			estado,
			usuarioAutenticado: req.usuario
		});

		if (!result.success) {
			return res.status(result.status).json({
				error: result.error,
				message: result.message
			});
		}

		res.status(201).json(result);
	} catch (error) {
		console.error('Error al inscribir alumno en curso:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * HU-45 #115: Desinscribe/Elimina un alumno del curso y actualiza automáticamente la cantidad y cupo disponible.
 */
export const desinscribirAlumnoCursoController = async (req, res) => {
	try {
		const { id, alumnoId } = req.params;

		const result = await desinscribirAlumnoCursoService({
			cursoId: id,
			alumnoId,
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
		console.error('Error al desinscribir alumno de curso:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};


/**
 * Crea un nuevo curso (HU-05 #89).

 * Delega al servicio la asociación del docente (#92), validación de código único y persistencia.
 */
export const createCursoController = async (req, res) => {
	try {
		const result = await crearCursoService({
			cursoData: req.body,
			usuarioAutenticado: req.usuario
		});

		if (!result.success) {
			return res.status(result.status).json({
				error: result.error,
				message: result.message
			});
		}

		res.status(201).json({
			id: result.id,
			message: result.message,
			curso: result.curso
		});
	} catch (error) {
		console.error('Error al crear curso:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * Actualiza los datos de un curso.
 * PROPIEDAD: Verifica que el usuario autenticado sea el docente titular del curso
 * o un administrador (rol_id === 2).
 */
export const updateCursoController = async (req, res) => {
	try {
		const { id } = req.params;
		const result = await actualizarCursoService({
			id,
			cursoData: req.body,
			usuarioAutenticado: req.usuario
		});

		if (!result.success) {
			return res.status(result.status).json({
				error: result.error,
				message: result.message
			});
		}

		res.status(200).json({
			id: result.id,
			message: result.message,
			curso: result.curso
		});
	} catch (error) {
		console.error('Error al actualizar curso:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * Elimina un curso.
 * PROPIEDAD: Verifica que el usuario sea el docente titular o administrador.
 */
export const deleteCursoController = async (req, res) => {
	try {
		const { id } = req.params;
		const result = await eliminarCursoService({
			id,
			usuarioAutenticado: req.usuario
		});

		if (!result.success) {
			return res.status(result.status).json({
				error: result.error,
				message: result.message
			});
		}

		res.status(200).json({
			id: result.id,
			message: result.message
		});
	} catch (error) {
		console.error('Error al eliminar curso:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

