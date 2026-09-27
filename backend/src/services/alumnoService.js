import {
	getAlumnos,
	buscarAlumnos,
	getAlumnoById,
	getPerfilCompletoAlumnoById,
	getCalificacionesByAlumnoId,
	getEvaluacionesByAlumnoId,
	getResumenAcademicoByAlumnoId,
	getHistorialAcademicoByAlumnoId,
	verificarDocenteAsignadoAAlumno
} from '../models/alumnoModel.js';

/**
 * Capa de Servicios: Lógica de Negocio, Listados, Búsqueda y Control de Acceso para el Módulo Alumnos
 * (HU-07: Visualizar listado #118, HU-08: Buscar alumno #130 & HU-09: Consultar perfil #139, HU-10: Historial #151).
 * 
 * Tareas HU-08:
 * - #131: Crear parámetro de búsqueda
 * - #136: Implementar filtrado
 * - #137: Manejar resultados vacíos
 * - #138: Probar búsquedas
 */

/**
 * Obtiene el listado general de alumnos con búsqueda dinámica y paginación (HU-07 #119, #122).
 * @param {object} params
 * @returns {Promise<{ data: Array, pagination: object, mensaje: string, filtros_aplicados: object }>}
 */
export const obtenerAlumnosService = async (params = {}) => {
	return getAlumnos(params);
};

/**
 * Servicio de búsqueda avanzada y filtrado de alumnos (HU-08 #130, #131, #136, #137).
 * Soporta búsqueda unificada (search / q), búsqueda por campos específicos (nombre, apellido, email, legajo),
 * filtros relacionales (curso_id, docente_id, escuela_id, estado, periodo), filtros de rendimiento (promedios, desempeno)
 * y ordenamiento dinámico.
 * 
 * @param {object} queryParams 
 * @returns {Promise<{ data: Array, pagination: object, mensaje: string, filtros_aplicados: object }>}
 */
export const buscarAlumnosService = async (queryParams = {}) => {
	return getAlumnos(queryParams);
};

/**
 * Obtiene los alumnos inscriptos en los cursos impartidos exclusivamente por el docente autenticado (HU-07 #120, #121).
 * @param {number|string} docenteId 
 * @param {object} options 
 * @returns {Promise<{ data: Array, pagination: object }>}
 */
export const obtenerMisAlumnosDocenteService = async (docenteId, options = {}) => {
	if (!docenteId) {
		return {
			data: [],
			pagination: { total: 0, page: 1, limit: 10, totalPages: 1 }
		};
	}

	return getAlumnos({
		...options,
		docente_id: docenteId
	});
};

/**
 * Obtiene los alumnos inscriptos en un curso específico (HU-07 #120).
 * @param {number|string} cursoId 
 * @param {object} options 
 * @returns {Promise<{ data: Array, pagination: object }>}
 */
export const obtenerAlumnosPorCursoService = async (cursoId, options = {}) => {
	return getAlumnos({
		...options,
		curso_id: cursoId
	});
};


/**
 * Valida si el usuario autenticado tiene permisos legítimos para acceder a los datos del alumno (HU-09 #150).
 * 
 * REGLAS DE SEGURIDAD Y CONTROL DE ACCESO (#150):
 * 1. El propio alumno puede consultar su propia información (ID coincide).
 * 2. Un administrador (rol_id === 2) puede consultar la información de cualquier alumno.
 * 3. Un docente puede consultar la información de un alumno SI Y SOLO SI el alumno está inscripto
 *    en al menos uno de los cursos que dicho docente imparte.
 * 4. Docentes ajenos o terceros reciben 403 Forbidden.
 * 
 * @param {number|string} alumnoId 
 * @param {object} usuarioAutenticado 
 * @returns {Promise<{ permitido: boolean, status?: number, error?: string, message?: string }>}
 */
export const validarAccesoAlumno = async (alumnoId, usuarioAutenticado) => {
	const usuarioId = usuarioAutenticado?.id;
	const esAdmin = usuarioAutenticado?.rol_id === 2;

	// 1. Verificación de autenticación (401)
	if (!usuarioId) {
		return {
			permitido: false,
			status: 401,
			error: 'No autenticado',
			message: 'Se requiere iniciar sesión con un token válido para acceder al perfil del alumno'
		};
	}

	const safeAlumnoId = parseInt(alumnoId, 10);
	if (isNaN(safeAlumnoId) || safeAlumnoId <= 0) {
		return {
			permitido: false,
			status: 400,
			error: 'Petición incorrecta',
			message: 'El identificador del alumno debe ser un número entero positivo'
		};
	}

	// 2. Acceso permitido: El propio alumno o Administrador
	if (usuarioId === safeAlumnoId || esAdmin) {
		return { permitido: true };
	}

	// 3. Acceso para Docentes: Verificar si el alumno pertenece a sus cursos asignados (#150)
	const esDocenteAsignado = await verificarDocenteAsignadoAAlumno(usuarioId, safeAlumnoId);
	if (esDocenteAsignado) {
		return { permitido: true };
	}

	// 4. Bloqueo 403 Forbidden para docentes ajenos o usuarios no autorizados
	return {
		permitido: false,
		status: 403,
		error: 'Acceso denegado',
		message: 'No tiene permisos para consultar la información académica de este alumno (solo el propio estudiante, sus docentes titulares o un administrador)'
	};
};

/**
 * Obtiene el perfil completo y consolidado del alumno (HU-09 #140, #149).
 * @param {number|string} alumnoId 
 * @param {object} usuarioAutenticado 
 * @returns {Promise<{ success: boolean, status: number, data?: object, error?: string, message?: string }>}
 */
export const obtenerPerfilAlumnoService = async (alumnoId, usuarioAutenticado) => {
	const validacion = await validarAccesoAlumno(alumnoId, usuarioAutenticado);
	if (!validacion.permitido) {
		return {
			success: false,
			status: validacion.status,
			error: validacion.error,
			message: validacion.message
		};
	}

	const safeAlumnoId = parseInt(alumnoId, 10);
	const perfil = await getPerfilCompletoAlumnoById(safeAlumnoId);

	if (!perfil) {
		return {
			success: false,
			status: 404,
			error: 'No encontrado',
			message: `No se encontró ningún alumno registrado con el ID ${safeAlumnoId}`
		};
	}

	return {
		success: true,
		status: 200,
		data: perfil
	};
};

/**
 * Obtiene el historial de calificaciones del alumno agrupadas por materia (HU-09 #145).
 * @param {number|string} alumnoId 
 * @param {object} usuarioAutenticado 
 * @returns {Promise<{ success: boolean, status: number, data?: object, error?: string, message?: string }>}
 */
export const obtenerCalificacionesAlumnoService = async (alumnoId, usuarioAutenticado) => {
	const validacion = await validarAccesoAlumno(alumnoId, usuarioAutenticado);
	if (!validacion.permitido) {
		return {
			success: false,
			status: validacion.status,
			error: validacion.error,
			message: validacion.message
		};
	}

	const safeAlumnoId = parseInt(alumnoId, 10);
	const alumno = await getAlumnoById(safeAlumnoId);
	if (!alumno) {
		return {
			success: false,
			status: 404,
			error: 'No encontrado',
			message: `No se encontró ningún alumno registrado con el ID ${safeAlumnoId}`
		};
	}

	const calificaciones = await getCalificacionesByAlumnoId(safeAlumnoId);
	const resumen = await getResumenAcademicoByAlumnoId(safeAlumnoId);

	return {
		success: true,
		status: 200,
		data: {
			alumno_id: safeAlumnoId,
			nombre_completo: `${alumno.nombre} ${alumno.apellido}`,
			promedio_general: resumen.promedio_general,
			total_calificaciones: calificaciones.length,
			calificaciones
		}
	};
};

/**
 * Obtiene la lista de evaluaciones programadas y rendidas del alumno (HU-09 #146).
 * @param {number|string} alumnoId 
 * @param {object} usuarioAutenticado 
 * @returns {Promise<{ success: boolean, status: number, data?: object, error?: string, message?: string }>}
 */
export const obtenerEvaluacionesAlumnoService = async (alumnoId, usuarioAutenticado) => {
	const validacion = await validarAccesoAlumno(alumnoId, usuarioAutenticado);
	if (!validacion.permitido) {
		return {
			success: false,
			status: validacion.status,
			error: validacion.error,
			message: validacion.message
		};
	}

	const safeAlumnoId = parseInt(alumnoId, 10);
	const alumno = await getAlumnoById(safeAlumnoId);
	if (!alumno) {
		return {
			success: false,
			status: 404,
			error: 'No encontrado',
			message: `No se encontró ningún alumno registrado con el ID ${safeAlumnoId}`
		};
	}

	const evaluaciones = await getEvaluacionesByAlumnoId(safeAlumnoId);

	return {
		success: true,
		status: 200,
		data: {
			alumno_id: safeAlumnoId,
			nombre_completo: `${alumno.nombre} ${alumno.apellido}`,
			total_evaluaciones: evaluaciones.length,
			evaluaciones
		}
	};
};

/**
 * Obtiene el resumen del desempeño y avance académico del alumno (HU-09 #149).
 * @param {number|string} alumnoId 
 * @param {object} usuarioAutenticado 
 * @returns {Promise<{ success: boolean, status: number, data?: object, error?: string, message?: string }>}
 */
export const obtenerResumenAcademicoService = async (alumnoId, usuarioAutenticado) => {
	const validacion = await validarAccesoAlumno(alumnoId, usuarioAutenticado);
	if (!validacion.permitido) {
		return {
			success: false,
			status: validacion.status,
			error: validacion.error,
			message: validacion.message
		};
	}

	const safeAlumnoId = parseInt(alumnoId, 10);
	const alumno = await getAlumnoById(safeAlumnoId);
	if (!alumno) {
		return {
			success: false,
			status: 404,
			error: 'No encontrado',
			message: `No se encontró ningún alumno registrado con el ID ${safeAlumnoId}`
		};
	}

	const resumen = await getResumenAcademicoByAlumnoId(safeAlumnoId);

	return {
		success: true,
		status: 200,
		data: {
			...resumen,
			nombre_completo: `${alumno.nombre} ${alumno.apellido}`,
			email: alumno.email
		}
	};
};

/**
 * Obtiene el historial académico completo de un alumno (HU-10: Consultar historial académico #151, #153, #154).
 * Valida los permisos de acceso (#150), verifica la existencia del alumno y recupera el historial
 * con cursos anteriores, cursos actuales, agrupaciones por cuatrimestre y métricas de avance.
 * 
 * @param {number|string} alumnoId 
 * @param {object} usuarioAutenticado 
 * @param {object} [filters]
 * @param {string} [filters.periodo]
 * @param {string} [filters.estado]
 * @param {number|string} [filters.curso_id]
 * @returns {Promise<{ success: boolean, status: number, data?: object, error?: string, message?: string }>}
 */
export const obtenerHistorialAcademicoService = async (alumnoId, usuarioAutenticado, filters = {}) => {
	const validacion = await validarAccesoAlumno(alumnoId, usuarioAutenticado);
	if (!validacion.permitido) {
		return {
			success: false,
			status: validacion.status,
			error: validacion.error,
			message: validacion.message
		};
	}

	const safeAlumnoId = parseInt(alumnoId, 10);
	const alumno = await getAlumnoById(safeAlumnoId);
	if (!alumno) {
		return {
			success: false,
			status: 404,
			error: 'No encontrado',
			message: `No se encontró ningún alumno registrado con el ID ${safeAlumnoId}`
		};
	}

	const historial = await getHistorialAcademicoByAlumnoId(safeAlumnoId, filters);

	return {
		success: true,
		status: 200,
		data: historial
	};
};

