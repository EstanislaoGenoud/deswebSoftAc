import {
	createCurso,
	getCursos,
	getCursosByDocenteId,
	getCursosByEscuelaId,
	getCursoById,
	getCursoDetalleById,
	getAlumnosByCursoId,
	getCantidadAlumnosByCursoId,
	getEstadisticasCapacidadCurso,
	getInscripcionCursoAlumno,
	inscribirAlumnoEnCurso,
	desinscribirAlumnoDeCurso,
	getEscuelaByCursoId,
	getCursoByCodigo,
	asociarCursoAEscuela,
	updateCurso,
	deleteCurso
} from '../models/cursoModel.js';
import { getUsuarioById } from '../models/usuarioModel.js';
import { getEscuelaById } from '../models/escuelaModel.js';

/**
 * Capa de Servicios: Lógica de Negocio para el Módulo de Cursos (HU-04, HU-05, HU-06, HU-44, HU-45).
 * Maneja reglas de negocio, resolución de docentes (#92), escuelas (#99, #106, #108),
 * validación de pertenencia de escuela (#109), conteo y capacidad de alumnos (#101, #113, #114),
 * matrícula y desmatriculación automática (#115), validación de permisos (#104) y CRUD.
 */



/**
 * Servicio para crear un nuevo curso (HU-05 #88, #89, #90, #92).
 * @param {object} params
 * @param {object} params.cursoData - Datos del curso a registrar.
 * @param {object} params.usuarioAutenticado - Payload del JWT autenticado.
 * @returns {Promise<{ success: boolean, status: number, data?: object, error?: string, message: string }>}
 */
export const crearCursoService = async ({ cursoData, usuarioAutenticado }) => {
	const usuarioId = usuarioAutenticado?.id;
	const esAdmin = usuarioAutenticado?.rol_id === 2;

	if (!usuarioId) {
		return {
			success: false,
			status: 401,
			error: 'No autenticado',
			message: 'Se requiere iniciar sesión para crear un curso'
		};
	}

	const {
		codigo,
		nombre,
		descripcion = '',
		escuela_id = 1,
		comision = 'Comisión A',
		periodo = '2026 - 1° Cuatrimestre',
		aula = 'Aula Virtual',
		horario = 'Lunes y Miércoles 18:30 - 21:30',
		cupo_maximo = 35,
		activo = 1,
		docente_id: customDocenteId
	} = cursoData || {};

	// HU-05 #92: Asociar curso con docente
	let finalDocenteId = usuarioId;

	if (esAdmin && customDocenteId && customDocenteId !== usuarioId) {
		const docenteRows = await getUsuarioById(customDocenteId);
		const docenteExiste = docenteRows && docenteRows.length > 0 ? docenteRows[0] : null;

		if (!docenteExiste) {
			return {
				success: false,
				status: 404,
				error: 'No encontrado',
				message: `No se encontró ningún docente registrado con el ID ${customDocenteId}`
			};
		}
		finalDocenteId = Number(customDocenteId);
	}

	// HU-44 #109: Validar pertenencia/existencia de la escuela
	const finalEscuelaId = parseInt(escuela_id, 10) || 1;
	const escuelaExiste = await getEscuelaById(finalEscuelaId);
	if (!escuelaExiste) {
		return {
			success: false,
			status: 404,
			error: 'No encontrado',
			message: `No se encontró ninguna escuela registrada con el ID ${finalEscuelaId}`
		};
	}

	// Verificar unicidad de código de curso
	const codigoLimpio = codigo.trim().toUpperCase();
	const cursoExistente = await getCursoByCodigo(codigoLimpio);
	if (cursoExistente) {
		return {
			success: false,
			status: 409,
			error: 'Conflicto',
			message: `Ya existe un curso registrado con el código '${codigoLimpio}'`
		};
	}

	const newId = await createCurso({
		codigo: codigoLimpio,
		nombre: nombre.trim(),
		descripcion: descripcion ? descripcion.trim() : '',
		docente_id: finalDocenteId,
		escuela_id: finalEscuelaId,
		comision: comision ? comision.trim() : 'Comisión A',
		periodo: periodo ? periodo.trim() : '2026 - 1° Cuatrimestre',
		aula: aula ? aula.trim() : 'Aula Virtual',
		horario: horario ? horario.trim() : 'Lunes y Miércoles 18:30 - 21:30',
		cupo_maximo: parseInt(cupo_maximo, 10) || 35,
		activo: activo !== undefined ? (activo ? 1 : 0) : 1
	});

	const cursoCreado = await getCursoDetalleById(newId);

	return {
		success: true,
		status: 201,
		id: newId,
		message: 'Curso creado exitosamente',
		curso: cursoCreado || {
			id: newId,
			codigo: codigoLimpio,
			nombre: nombre.trim(),
			docente_id: finalDocenteId,
			escuela_id: finalEscuelaId,
			comision,
			periodo,
			aula,
			horario,
			cupo_maximo,
			activo
		}
	};
};

/**
 * Servicio para obtener cursos paginados y filtrados (HU-04, HU-44 #106).
 */
export const obtenerCursosService = async ({ search, docente_id, escuela_id, page, limit, activo }) => {
	return await getCursos({ search, docente_id, escuela_id, page, limit, activo });
};


/**
 * Servicio para obtener cursos de un docente específico (HU-04 #79).
 */
export const obtenerCursosDocenteService = async (docenteId, options = {}) => {
	return await getCursosByDocenteId(docenteId, options);
};

/**
 * Servicio para obtener la ficha básica de un curso por su ID.
 */
export const obtenerCursoPorIdService = async (id) => {
	const curso = await getCursoById(id);
	if (!curso) {
		return {
			success: false,
			status: 404,
			error: 'No encontrado',
			message: `No se encontró ningún curso con el ID ${id}`
		};
	}
	return {
		success: true,
		status: 200,
		curso
	};
};

/**
 * Servicio para obtener la información detallada completa de un curso (HU-06 #97),
 * incluyendo la escuela asociada (#99) y la cantidad de alumnos inscriptos (#101).
 * @param {number|string} id 
 * @param {object} usuarioAutenticado 
 * @returns {Promise<{ success: boolean, status: number, curso?: object, error?: string, message?: string }>}
 */
export const obtenerCursoDetalleService = async (id, usuarioAutenticado = null) => {
	const curso = await getCursoDetalleById(id);
	if (!curso) {
		return {
			success: false,
			status: 404,
			error: 'No encontrado',
			message: `No se encontró ningún curso con el ID ${id}`
		};
	}

	const usuarioId = usuarioAutenticado?.id;
	const esTitular = usuarioId === curso.docente_id;
	const esAdmin = usuarioAutenticado?.rol_id === 2;

	return {
		success: true,
		status: 200,
		curso: {
			...curso,
			permisos: {
				es_titular: esTitular,
				es_admin: esAdmin,
				puede_gestionar: esTitular || esAdmin
			}
		}
	};
};

/**
 * Servicio para obtener la escuela asociada a un curso (HU-06 #99).
 * @param {number|string} cursoId 
 * @returns {Promise<{ success: boolean, status: number, escuela?: object, error?: string, message?: string }>}
 */
export const obtenerEscuelaDeCursoService = async (cursoId) => {
	const curso = await getCursoById(cursoId);
	if (!curso) {
		return {
			success: false,
			status: 404,
			error: 'No encontrado',
			message: `No se encontró ningún curso con el ID ${cursoId}`
		};
	}

	const escuela = await getEscuelaByCursoId(cursoId);
	return {
		success: true,
		status: 200,
		curso_id: Number(cursoId),
		escuela: escuela || {
			id: 1,
			codigo: 'ESC-INF',
			nombre: 'Escuela de Informática y Tecnología',
			director: 'Dr. Roberto Gómez',
			email_contacto: 'informatica@instituto.edu.ar',
			ubicacion: 'Campus Central'
		}
	};
};

/**
 * Servicio para obtener la lista de alumnos inscriptos con validación de permisos (HU-06 #101, #104).
 * REGLA DE SEGURIDAD (#104): Solo el docente titular o un administrador pueden acceder al listado de alumnos.
 * @param {object} params
 * @param {number|string} params.cursoId
 * @param {object} params.usuarioAutenticado
 * @returns {Promise<{ success: boolean, status: number, data?: object, error?: string, message?: string }>}
 */
export const obtenerAlumnosCursoService = async ({ cursoId, usuarioAutenticado }) => {
	const usuarioId = usuarioAutenticado?.id;
	const esAdmin = usuarioAutenticado?.rol_id === 2;

	// Validación de autenticación (#104)
	if (!usuarioId) {
		return {
			success: false,
			status: 401,
			error: 'No autenticado',
			message: 'Se requiere iniciar sesión para consultar el listado de alumnos'
		};
	}

	const curso = await getCursoById(cursoId);
	if (!curso) {
		return {
			success: false,
			status: 404,
			error: 'No encontrado',
			message: `No se encontró ningún curso con el ID ${cursoId}`
		};
	}

	// Validación estricta de permisos (#104): Solo titular o admin
	if (curso.docente_id !== usuarioId && !esAdmin) {
		return {
			success: false,
			status: 403,
			error: 'Acceso denegado',
			message: 'No tiene permisos para consultar el listado de alumnos de este curso (solo el docente titular o administrador)'
		};
	}

	const alumnos = await getAlumnosByCursoId(cursoId);
	const cupoMaximo = curso.cupo_maximo || 35;
	const cantidadAlumnos = alumnos.length;
	const cuposDisponibles = Math.max(0, cupoMaximo - cantidadAlumnos);

	return {
		success: true,
		status: 200,
		curso_id: Number(cursoId),
		curso_nombre: curso.nombre,
		codigo: curso.codigo,
		total_alumnos: cantidadAlumnos,
		cupo_maximo: cupoMaximo,
		cupos_disponibles: cuposDisponibles,
		alumnos
	};
};

/**
 * Servicio para consultar las estadísticas de capacidad y cantidad de alumnos de un curso (HU-45 #113, #114).
 * @param {number|string} cursoId 
 * @returns {Promise<{ success: boolean, status: number, data?: object, error?: string, message?: string }>}
 */
export const obtenerCapacidadYAlumnosCursoService = async (cursoId) => {
	const cursoExistente = await getCursoById(cursoId);
	if (!cursoExistente) {
		return {
			success: false,
			status: 404,
			error: 'No encontrado',
			message: `No se encontró ningún curso con el ID ${cursoId}`
		};
	}

	const stats = await getEstadisticasCapacidadCurso(cursoId);

	return {
		success: true,
		status: 200,
		data: stats
	};
};

/**
 * Servicio para inscribir/matricular un alumno en un curso (HU-45 #115).
 * Actualiza automáticamente la cantidad de alumnos y cupos disponibles.
 * 
 * @param {object} params
 * @param {number|string} params.cursoId
 * @param {number|string} params.alumnoId
 * @param {string} [params.estado]
 * @param {object} params.usuarioAutenticado
 * @returns {Promise<{ success: boolean, status: number, message: string, data?: object, error?: string }>}
 */
export const inscribirAlumnoCursoService = async ({ cursoId, alumnoId, estado = 'inscripto', usuarioAutenticado }) => {
	const usuarioId = usuarioAutenticado?.id;
	const esAdmin = usuarioAutenticado?.rol_id === 2;

	// 1. Autenticación
	if (!usuarioId) {
		return {
			success: false,
			status: 401,
			error: 'No autenticado',
			message: 'Se requiere iniciar sesión para inscribir alumnos en el curso'
		};
	}

	// 2. Existencia del curso
	const curso = await getCursoById(cursoId);
	if (!curso) {
		return {
			success: false,
			status: 404,
			error: 'No encontrado',
			message: `No se encontró ningún curso con el ID ${cursoId}`
		};
	}

	// 3. Permisos (Solo docente titular o admin)
	if (curso.docente_id !== usuarioId && !esAdmin) {
		return {
			success: false,
			status: 403,
			error: 'Acceso denegado',
			message: 'No tiene permisos para inscribir alumnos en este curso (no es el docente titular ni administrador)'
		};
	}

	// 4. Existencia del alumno
	const safeAlumnoId = parseInt(alumnoId, 10);
	if (isNaN(safeAlumnoId) || safeAlumnoId <= 0) {
		return {
			success: false,
			status: 400,
			error: 'Petición incorrecta',
			message: 'El identificador del alumno debe ser un número entero positivo'
		};
	}

	const alumnoRows = await getUsuarioById(safeAlumnoId);
	const alumnoExiste = alumnoRows && alumnoRows.length > 0 ? alumnoRows[0] : null;
	if (!alumnoExiste) {
		return {
			success: false,
			status: 404,
			error: 'No encontrado',
			message: `No se encontró ningún alumno registrado con el ID ${safeAlumnoId}`
		};
	}

	// 5. Verificación de cupo disponible (#115)
	const statsActuales = await getEstadisticasCapacidadCurso(cursoId);
	if (statsActuales.cupos_disponibles <= 0) {
		return {
			success: false,
			status: 409,
			error: 'Conflicto',
			message: `Cupo máximo alcanzado (${statsActuales.cupo_maximo} alumnos). No hay cupos disponibles para inscribir nuevos estudiantes.`
		};
	}

	// 6. Verificación de no duplicidad de inscripción
	const inscripcionPrevia = await getInscripcionCursoAlumno(cursoId, safeAlumnoId);
	if (inscripcionPrevia) {
		return {
			success: false,
			status: 409,
			error: 'Conflicto',
			message: `El alumno '${alumnoExiste.nombre} ${alumnoExiste.apellido}' ya se encuentra inscripto en este curso`
		};
	}

	// 7. Registro de la inscripción (#115)
	const inscripcionId = await inscribirAlumnoEnCurso({
		cursoId,
		alumnoId: safeAlumnoId,
		estado: estado || 'inscripto'
	});

	// 8. Consulta de estadísticas actualizadas automáticamente (#115)
	const estadisticasActualizadas = await getEstadisticasCapacidadCurso(cursoId);

	return {
		success: true,
		status: 201,
		message: `El alumno '${alumnoExiste.nombre} ${alumnoExiste.apellido}' fue inscripto exitosamente en el curso`,
		data: {
			inscripcion_id: inscripcionId,
			curso_id: Number(cursoId),
			alumno_id: safeAlumnoId,
			alumno: {
				id: alumnoExiste.id,
				nombre: alumnoExiste.nombre,
				apellido: alumnoExiste.apellido,
				email: alumnoExiste.email
			},
			estadisticas: estadisticasActualizadas
		}
	};
};

/**
 * Servicio para desinscribir/eliminar un alumno de un curso (HU-45 #115).
 * Actualiza automáticamente la cantidad de alumnos y cupos disponibles.
 * 
 * @param {object} params
 * @param {number|string} params.cursoId
 * @param {number|string} params.alumnoId
 * @param {object} params.usuarioAutenticado
 * @returns {Promise<{ success: boolean, status: number, message: string, data?: object, error?: string }>}
 */
export const desinscribirAlumnoCursoService = async ({ cursoId, alumnoId, usuarioAutenticado }) => {
	const usuarioId = usuarioAutenticado?.id;
	const esAdmin = usuarioAutenticado?.rol_id === 2;

	// 1. Autenticación
	if (!usuarioId) {
		return {
			success: false,
			status: 401,
			error: 'No autenticado',
			message: 'Se requiere iniciar sesión para eliminar alumnos del curso'
		};
	}

	// 2. Existencia del curso
	const curso = await getCursoById(cursoId);
	if (!curso) {
		return {
			success: false,
			status: 404,
			error: 'No encontrado',
			message: `No se encontró ningún curso con el ID ${cursoId}`
		};
	}

	// 3. Permisos
	if (curso.docente_id !== usuarioId && !esAdmin) {
		return {
			success: false,
			status: 403,
			error: 'Acceso denegado',
			message: 'No tiene permisos para desinscribir alumnos de este curso (no es el docente titular ni administrador)'
		};
	}

	// 4. Verificación de inscripción existente
	const safeAlumnoId = parseInt(alumnoId, 10);
	const inscripcion = await getInscripcionCursoAlumno(cursoId, safeAlumnoId);
	if (!inscripcion) {
		return {
			success: false,
			status: 404,
			error: 'No encontrado',
			message: `El alumno con ID ${safeAlumnoId} no se encuentra inscripto en este curso`
		};
	}

	// 5. Eliminación de la inscripción (#115)
	await desinscribirAlumnoDeCurso(cursoId, safeAlumnoId);

	// 6. Consulta de estadísticas actualizadas automáticamente (#115)
	const estadisticasActualizadas = await getEstadisticasCapacidadCurso(cursoId);

	return {
		success: true,
		status: 200,
		message: 'El alumno fue desinscripto exitosamente del curso',
		data: {
			curso_id: Number(cursoId),
			alumno_id: safeAlumnoId,
			estadisticas: estadisticasActualizadas
		}
	};
};


/**
 * Servicio para actualizar un curso con verificación de propiedad.
 */
export const actualizarCursoService = async ({ id, cursoData, usuarioAutenticado }) => {
	const usuarioId = usuarioAutenticado?.id;
	const esAdmin = usuarioAutenticado?.rol_id === 2;

	const cursoExistente = await getCursoById(id);
	if (!cursoExistente) {
		return {
			success: false,
			status: 404,
			error: 'No encontrado',
			message: `No se encontró ningún curso con el ID ${id}`
		};
	}

	if (cursoExistente.docente_id !== usuarioId && !esAdmin) {
		return {
			success: false,
			status: 403,
			error: 'Acceso denegado',
			message: 'No tiene permisos para modificar este curso (no es el docente titular ni administrador)'
		};
	}

	const { codigo, nombre, descripcion, escuela_id, comision, periodo, aula, horario, cupo_maximo, activo } = cursoData || {};

	// HU-44 #109: Validar pertenencia/existencia de la escuela si se actualiza
	if (escuela_id !== undefined && escuela_id !== null) {
		const targetEscuelaId = parseInt(escuela_id, 10);
		const escuelaExiste = await getEscuelaById(targetEscuelaId);
		if (!escuelaExiste) {
			return {
				success: false,
				status: 404,
				error: 'No encontrado',
				message: `No se encontró ninguna escuela registrada con el ID ${targetEscuelaId}`
			};
		}
	}

	if (codigo && codigo.trim().toUpperCase() !== cursoExistente.codigo) {
		const codigoLimpio = codigo.trim().toUpperCase();
		const cursoConMismoCodigo = await getCursoByCodigo(codigoLimpio);
		if (cursoConMismoCodigo && cursoConMismoCodigo.id !== Number(id)) {
			return {
				success: false,
				status: 409,
				error: 'Conflicto',
				message: `Ya existe otro curso con el código '${codigoLimpio}'`
			};
		}
	}

	await updateCurso(id, {
		codigo: codigo ? codigo.trim().toUpperCase() : cursoExistente.codigo,
		nombre: nombre ? nombre.trim() : cursoExistente.nombre,
		descripcion: descripcion !== undefined ? descripcion.trim() : cursoExistente.descripcion,
		escuela_id: escuela_id ? parseInt(escuela_id, 10) : cursoExistente.escuela_id,
		comision: comision || cursoExistente.comision,
		periodo: periodo || cursoExistente.periodo,
		aula: aula || cursoExistente.aula,
		horario: horario || cursoExistente.horario,
		cupo_maximo: cupo_maximo !== undefined ? cupo_maximo : cursoExistente.cupo_maximo,
		activo: activo !== undefined ? activo : cursoExistente.activo
	});

	const cursoActualizado = await getCursoDetalleById(id);

	return {
		success: true,
		status: 200,
		id: Number(id),
		message: 'Curso actualizado exitosamente',
		curso: cursoActualizado
	};
};

/**
 * Servicio para asociar un curso a una escuela (HU-44 #108).
 * Valida permisos (#104) y existencia de la escuela (#109).
 */
export const asociarCursoAEscuelaService = async ({ cursoId, escuelaId, usuarioAutenticado }) => {
	const usuarioId = usuarioAutenticado?.id;
	const esAdmin = usuarioAutenticado?.rol_id === 2;

	if (!usuarioId) {
		return {
			success: false,
			status: 401,
			error: 'No autenticado',
			message: 'Se requiere iniciar sesión para asociar el curso a una escuela'
		};
	}

	const cursoExistente = await getCursoById(cursoId);
	if (!cursoExistente) {
		return {
			success: false,
			status: 404,
			error: 'No encontrado',
			message: `No se encontró ningún curso con el ID ${cursoId}`
		};
	}

	if (cursoExistente.docente_id !== usuarioId && !esAdmin) {
		return {
			success: false,
			status: 403,
			error: 'Acceso denegado',
			message: 'No tiene permisos para modificar la escuela de este curso (no es el docente titular ni administrador)'
		};
	}

	const finalEscuelaId = parseInt(escuelaId, 10);
	if (isNaN(finalEscuelaId) || finalEscuelaId <= 0) {
		return {
			success: false,
			status: 400,
			error: 'Petición incorrecta',
			message: 'El identificador de escuela debe ser un número entero positivo válido'
		};
	}

	const escuelaDestino = await getEscuelaById(finalEscuelaId);
	if (!escuelaDestino) {
		return {
			success: false,
			status: 404,
			error: 'No encontrado',
			message: `No se encontró ninguna escuela registrada con el ID ${finalEscuelaId}`
		};
	}

	await asociarCursoAEscuela(cursoId, finalEscuelaId);
	const cursoActualizado = await getCursoDetalleById(cursoId);

	return {
		success: true,
		status: 200,
		message: `El curso '${cursoExistente.nombre}' fue asociado exitosamente a la ${escuelaDestino.nombre}`,
		data: {
			curso_id: Number(cursoId),
			escuela_id: finalEscuelaId,
			curso: cursoActualizado
		}
	};
};


/**
 * Servicio para eliminar un curso con verificación de propiedad.
 */
export const eliminarCursoService = async ({ id, usuarioAutenticado }) => {
	const usuarioId = usuarioAutenticado?.id;
	const esAdmin = usuarioAutenticado?.rol_id === 2;

	const cursoExistente = await getCursoById(id);
	if (!cursoExistente) {
		return {
			success: false,
			status: 404,
			error: 'No encontrado',
			message: `No se encontró ningún curso con el ID ${id}`
		};
	}

	if (cursoExistente.docente_id !== usuarioId && !esAdmin) {
		return {
			success: false,
			status: 403,
			error: 'Acceso denegado',
			message: 'No tiene permisos para eliminar este curso (no es el docente titular ni administrador)'
		};
	}

	await deleteCurso(id);

	return {
		success: true,
		status: 200,
		id: Number(id),
		message: 'Curso eliminado exitosamente'
	};
};
