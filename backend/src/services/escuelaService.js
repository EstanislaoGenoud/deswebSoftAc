import {
	getAllEscuelas,
	getEscuelaById,
	getEscuelaByCodigo,
	createEscuela,
	updateEscuela,
	countCursosByEscuela
} from '../models/escuelaModel.js';
import {
	getCursoById,
	getCursoDetalleById,
	getCursosByEscuelaId,
	asociarCursoAEscuela
} from '../models/cursoModel.js';

/**
 * Capa de Servicios: Lógica de Negocio para el Módulo de Escuelas.
 * HU-44: Asociar curso a una escuela (#105)
 * Tareas: #106 (Definir relación), #108 (Implementar asociación), #109 (Validar pertenencia), #111 (Probar asociación).
 */

/**
 * Obtiene el catálogo de todas las escuelas disponibles.
 * @returns {Promise<{ success: boolean, status: number, total: number, data: Array }>}
 */
export const obtenerEscuelasService = async () => {
	const escuelas = await getAllEscuelas();
	return {
		success: true,
		status: 200,
		total: escuelas.length,
		data: escuelas
	};
};

/**
 * Obtiene la información detallada de una escuela por su ID.
 * @param {number|string} id 
 * @returns {Promise<{ success: boolean, status: number, data?: object, error?: string, message?: string }>}
 */
export const obtenerEscuelaPorIdService = async (id) => {
	const escuela = await getEscuelaById(id);
	if (!escuela) {
		return {
			success: false,
			status: 404,
			error: 'No encontrado',
			message: `No se encontró ninguna escuela registrada con el ID ${id}`
		};
	}

	return {
		success: true,
		status: 200,
		data: escuela
	};
};

/**
 * Obtiene el listado de cursos pertenecientes a una escuela específica (HU-44 #106).
 * @param {number|string} escuelaId 
 * @param {object} options 
 * @returns {Promise<{ success: boolean, status: number, escuela_id: number, data?: Array, pagination?: object, error?: string, message?: string }>}
 */
export const obtenerCursosPorEscuelaService = async (escuelaId, options = {}) => {
	const escuela = await getEscuelaById(escuelaId);
	if (!escuela) {
		return {
			success: false,
			status: 404,
			error: 'No encontrado',
			message: `No se encontró ninguna escuela registrada con el ID ${escuelaId}`
		};
	}

	const result = await getCursosByEscuelaId(escuelaId, options);

	return {
		success: true,
		status: 200,
		escuela_id: Number(escuelaId),
		escuela_nombre: escuela.nombre,
		escuela_codigo: escuela.codigo,
		data: result.data,
		pagination: result.pagination
	};
};

/**
 * Asocia un curso a una escuela académica (HU-44 #108).
 * REGLAS DE NEGOCIO Y SEGURIDAD (#109):
 * 1. Valida autenticación del usuario.
 * 2. Valida que el curso exista (404 Not Found).
 * 3. Valida propiedad: solo el docente titular o administrador pueden cambiar la escuela (403 Forbidden).
 * 4. Valida que la escuela exista en la base de datos (404 Not Found si no existe).
 * 5. Actualiza la clave foránea escuela_id del curso.
 * 
 * @param {object} params
 * @param {number|string} params.cursoId
 * @param {number|string} params.escuelaId
 * @param {object} params.usuarioAutenticado
 * @returns {Promise<{ success: boolean, status: number, data?: object, error?: string, message: string }>}
 */
export const asociarCursoAEscuelaService = async ({ cursoId, escuelaId, usuarioAutenticado }) => {
	const usuarioId = usuarioAutenticado?.id;
	const esAdmin = usuarioAutenticado?.rol_id === 2;

	// 1. Autenticación
	if (!usuarioId) {
		return {
			success: false,
			status: 401,
			error: 'No autenticado',
			message: 'Se requiere iniciar sesión para asociar el curso a una escuela'
		};
	}

	// 2. Existencia de curso
	const cursoExistente = await getCursoById(cursoId);
	if (!cursoExistente) {
		return {
			success: false,
			status: 404,
			error: 'No encontrado',
			message: `No se encontró ningún curso con el ID ${cursoId}`
		};
	}

	// 3. Verificación de propiedad (Titular o Administrador)
	if (cursoExistente.docente_id !== usuarioId && !esAdmin) {
		return {
			success: false,
			status: 403,
			error: 'Acceso denegado',
			message: 'No tiene permisos para modificar la escuela de este curso (no es el docente titular ni administrador)'
		};
	}

	// 4. Validación de pertenencia/existencia de la escuela (#109)
	const escuelaDestino = await getEscuelaById(escuelaId);
	if (!escuelaDestino) {
		return {
			success: false,
			status: 404,
			error: 'No encontrado',
			message: `No se encontró ninguna escuela registrada con el ID ${escuelaId}`
		};
	}

	// 5. Persistencia de la asociación (#108)
	await asociarCursoAEscuela(cursoId, escuelaId);

	// Obtener el curso actualizado con todos los metadatos institucionales
	const cursoActualizado = await getCursoDetalleById(cursoId);

	return {
		success: true,
		status: 200,
		message: `El curso '${cursoExistente.nombre}' fue asociado exitosamente a la ${escuelaDestino.nombre}`,
		data: {
			curso_id: Number(cursoId),
			escuela_id: Number(escuelaId),
			curso: cursoActualizado
		}
	};
};
