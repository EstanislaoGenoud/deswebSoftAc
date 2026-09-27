import pool from '../config/connection.js';

/**
 * Modelo para la entidad Cursos.
 * Implementa consultas SQL optimizadas, paginación con LIMIT y OFFSET,
 * búsqueda dinámica con LIKE parametrizado de forma segura, filtros por docente,
 * detalle con escuela asociada (HU-06 #99) y conteo de alumnos (HU-06 #101).
 */

/**
 * Inserta un nuevo curso en la base de datos.
 * @param {object} param0 
 * @returns {Promise<number>} ID del curso insertado
 */
export const createCurso = async ({
	codigo,
	nombre,
	descripcion = '',
	docente_id,
	escuela_id = 1,
	comision = 'Comisión A',
	periodo = '2026 - 1° Cuatrimestre',
	aula = 'Aula Virtual',
	horario = 'Lunes y Miércoles 18:30 - 21:30',
	cupo_maximo = 35,
	activo = 1
}) => {
	const query = `
		INSERT INTO cursos (
			codigo, nombre, descripcion, docente_id, escuela_id,
			comision, periodo, aula, horario, cupo_maximo, activo
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`;
	const [result] = await pool.execute(query, [
		codigo.trim().toUpperCase(),
		nombre.trim(),
		descripcion ? descripcion.trim() : '',
		docente_id,
		parseInt(escuela_id, 10) || 1,
		comision ? comision.trim() : 'Comisión A',
		periodo ? periodo.trim() : '2026 - 1° Cuatrimestre',
		aula ? aula.trim() : 'Aula Virtual',
		horario ? horario.trim() : 'Lunes y Miércoles 18:30 - 21:30',
		parseInt(cupo_maximo, 10) || 35,
		activo !== undefined ? (activo ? 1 : 0) : 1
	]);
	return result.insertId;
};

/**
 * Obtiene cursos con soporte para búsqueda dinámica (LIKE), filtro por docente, filtro por escuela y paginación.
 * @param {{ search?: string, docente_id?: number|string, escuela_id?: number|string, page?: number|string, limit?: number|string, activo?: number|string }} options
 * @returns {Promise<{ data: Array, pagination: { total: number, page: number, limit: number, totalPages: number } }>}
 */
export const getCursos = async ({
	search = '',
	docente_id = null,
	escuela_id = null,
	page = 1,
	limit = 10,
	activo = null
} = {}) => {
	const safePage = Math.max(1, parseInt(page, 10) || 1);
	const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
	const offset = (safePage - 1) * safeLimit;

	let countQuery = 'SELECT COUNT(*) as total FROM cursos c JOIN usuarios u ON c.docente_id = u.id LEFT JOIN escuelas e ON c.escuela_id = e.id';
	let dataQuery = `
		SELECT 
			c.id, 
			c.codigo, 
			c.nombre, 
			c.descripcion, 
			c.docente_id,
			c.escuela_id,
			c.comision, 
			c.periodo, 
			c.aula, 
			c.horario, 
			c.cupo_maximo, 
			c.activo, 
			c.fecha_creacion, 
			c.fecha_actualizacion,
			u.nombre AS docente_nombre,
			u.apellido AS docente_apellido,
			u.email AS docente_email,
			COALESCE(e.nombre, 'Escuela General') AS escuela_nombre,
			COALESCE(e.codigo, 'ESC-GEN') AS escuela_codigo,
			COALESCE(
				(SELECT COUNT(*) FROM inscripciones i WHERE i.curso_id = c.id), 
				0
			) AS cantidad_alumnos
		FROM cursos c
		JOIN usuarios u ON c.docente_id = u.id
		LEFT JOIN escuelas e ON c.escuela_id = e.id
	`;

	const whereConditions = [];
	const countParams = [];
	const dataParams = [];

	if (docente_id !== null && docente_id !== undefined && docente_id !== '') {
		whereConditions.push('c.docente_id = ?');
		countParams.push(docente_id);
		dataParams.push(docente_id);
	}

	if (escuela_id !== null && escuela_id !== undefined && escuela_id !== '') {
		whereConditions.push('c.escuela_id = ?');
		countParams.push(escuela_id);
		dataParams.push(escuela_id);
	}

	if (activo !== null && activo !== undefined && activo !== '') {
		whereConditions.push('c.activo = ?');
		const activoVal = activo === true || activo === '1' || activo === 1 ? 1 : 0;
		countParams.push(activoVal);
		dataParams.push(activoVal);
	}

	if (search && search.trim() !== '') {
		const searchPattern = `%${search.trim()}%`;
		whereConditions.push('(c.nombre LIKE ? OR c.codigo LIKE ? OR c.descripcion LIKE ? OR c.comision LIKE ? OR c.aula LIKE ?)');
		for (let i = 0; i < 5; i++) {
			countParams.push(searchPattern);
			dataParams.push(searchPattern);
		}
	}

	if (whereConditions.length > 0) {
		const whereClause = ` WHERE ${whereConditions.join(' AND ')}`;
		countQuery += whereClause;
		dataQuery += whereClause;
	}

	dataQuery += ` ORDER BY c.fecha_creacion DESC LIMIT ${safeLimit} OFFSET ${offset}`;

	const [[countResult], [rows]] = await Promise.all([
		pool.execute(countQuery, countParams),
		pool.execute(dataQuery, dataParams)
	]);

	const total = countResult[0]?.total || 0;
	const totalPages = Math.ceil(total / safeLimit) || 1;

	return {
		data: rows,
		pagination: {
			total,
			page: safePage,
			limit: safeLimit,
			totalPages
		}
	};
};

/**
 * Obtiene los cursos asociados exclusivamente a un docente por su ID.
 * @param {number|string} docente_id 
 * @param {{ search?: string, page?: number|string, limit?: number|string, activo?: number|string }} options
 * @returns {Promise<{ data: Array, pagination: { total: number, page: number, limit: number, totalPages: number } }>}
 */
export const getCursosByDocenteId = async (docente_id, options = {}) => {
	return getCursos({
		...options,
		docente_id
	});
};

/**
 * Obtiene los cursos asociados a una escuela específica (HU-44 #106).
 * @param {number|string} escuela_id 
 * @param {{ search?: string, page?: number|string, limit?: number|string, activo?: number|string }} options
 * @returns {Promise<{ data: Array, pagination: { total: number, page: number, limit: number, totalPages: number } }>}
 */
export const getCursosByEscuelaId = async (escuela_id, options = {}) => {
	return getCursos({
		...options,
		escuela_id
	});
};

/**
 * Asocia un curso a una escuela específica (HU-44 #108).
 * @param {number|string} cursoId 
 * @param {number|string} escuelaId 
 * @returns {Promise<number>} Filas afectadas
 */
export const asociarCursoAEscuela = async (cursoId, escuelaId) => {
	const query = 'UPDATE cursos SET escuela_id = ? WHERE id = ?';
	const [result] = await pool.execute(query, [parseInt(escuelaId, 10), parseInt(cursoId, 10)]);
	return result.affectedRows;
};


/**
 * Obtiene un curso por su ID junto con los datos del docente.
 * @param {number|string} id 
 * @returns {Promise<object|null>}
 */
export const getCursoById = async (id) => {
	const query = `
		SELECT 
			c.id, 
			c.codigo, 
			c.nombre, 
			c.descripcion, 
			c.docente_id, 
			c.escuela_id,
			c.comision, 
			c.periodo, 
			c.aula, 
			c.horario, 
			c.cupo_maximo, 
			c.activo, 
			c.fecha_creacion, 
			c.fecha_actualizacion,
			u.nombre AS docente_nombre,
			u.apellido AS docente_apellido,
			u.email AS docente_email
		FROM cursos c
		JOIN usuarios u ON c.docente_id = u.id
		WHERE c.id = ?
	`;
	const [rows] = await pool.execute(query, [id]);
	return rows.length > 0 ? rows[0] : null;
};

/**
 * Obtiene el detalle completo de un curso incluyendo escuela asociada (HU-06 #99)
 * y cantidad de alumnos inscriptos (HU-06 #101).
 * @param {number|string} id 
 * @returns {Promise<object|null>}
 */
export const getCursoDetalleById = async (id) => {
	const query = `
		SELECT 
			c.id, 
			c.codigo, 
			c.nombre, 
			c.descripcion, 
			c.docente_id, 
			c.escuela_id,
			c.comision, 
			c.periodo, 
			c.aula, 
			c.horario, 
			c.cupo_maximo, 
			c.activo, 
			c.fecha_creacion, 
			c.fecha_actualizacion,
			u.nombre AS docente_nombre,
			u.apellido AS docente_apellido,
			u.email AS docente_email,
			COALESCE(e.id, 1) AS escuela_id,
			COALESCE(e.nombre, 'Escuela de Informática y Tecnología') AS escuela_nombre,
			COALESCE(e.codigo, 'ESC-INF') AS escuela_codigo,
			COALESCE(e.director, 'Dr. Roberto Gómez') AS escuela_director,
			COALESCE(e.email_contacto, 'informatica@instituto.edu.ar') AS escuela_contacto,
			COALESCE(e.ubicacion, 'Campus Central') AS escuela_ubicacion,
			COALESCE(
				(SELECT COUNT(*) FROM inscripciones i WHERE i.curso_id = c.id), 
				0
			) AS cantidad_alumnos
		FROM cursos c
		JOIN usuarios u ON c.docente_id = u.id
		LEFT JOIN escuelas e ON c.escuela_id = e.id
		WHERE c.id = ?
	`;
	const [rows] = await pool.execute(query, [id]);
	if (rows.length === 0) return null;

	const curso = rows[0];
	const cupoMaximo = curso.cupo_maximo || 35;
	const cantidadAlumnos = Number(curso.cantidad_alumnos) || 0;
	const cuposDisponibles = Math.max(0, cupoMaximo - cantidadAlumnos);
	const porcentajeOcupacion = Math.min(100, Math.round((cantidadAlumnos / cupoMaximo) * 100));

	return {
		...curso,
		cantidad_alumnos: cantidadAlumnos,
		cupos_disponibles: cuposDisponibles,
		porcentaje_ocupacion: porcentajeOcupacion,
		escuela: {
			id: curso.escuela_id,
			nombre: curso.escuela_nombre,
			codigo: curso.escuela_codigo,
			director: curso.escuela_director,
			email_contacto: curso.escuela_contacto,
			ubicacion: curso.escuela_ubicacion
		},
		docente: {
			id: curso.docente_id,
			nombre: curso.docente_nombre,
			apellido: curso.docente_apellido,
			email: curso.docente_email
		}
	};
};

/**
 * Obtiene la lista detallada de alumnos inscriptos en un curso (HU-06 #101, #104).
 * @param {number|string} cursoId 
 * @returns {Promise<Array>}
 */
export const getAlumnosByCursoId = async (cursoId) => {
	const query = `
		SELECT 
			u.id AS alumno_id,
			u.nombre,
			u.apellido,
			u.email,
			i.estado,
			i.fecha_inscripcion
		FROM inscripciones i
		JOIN usuarios u ON i.alumno_id = u.id
		WHERE i.curso_id = ?
		ORDER BY u.apellido ASC, u.nombre ASC
	`;
	const [rows] = await pool.execute(query, [cursoId]);
	return rows;
};

/**
 * Obtiene la cantidad de alumnos inscriptos en un curso (HU-06 #101, HU-45 #113).
 * @param {number|string} cursoId 
 * @returns {Promise<number>}
 */
export const getCantidadAlumnosByCursoId = async (cursoId) => {
	const query = 'SELECT COUNT(*) as count FROM inscripciones WHERE curso_id = ?';
	const [rows] = await pool.execute(query, [parseInt(cursoId, 10)]);
	return rows[0]?.count || 0;
};

/**
 * Obtiene las estadísticas detalladas de capacidad y ocupación de un curso (HU-45 #113, #114).
 * @param {number|string} cursoId 
 * @returns {Promise<object|null>}
 */
export const getEstadisticasCapacidadCurso = async (cursoId) => {
	const query = `
		SELECT 
			c.id AS curso_id,
			c.codigo,
			c.nombre,
			c.cupo_maximo,
			COALESCE((SELECT COUNT(*) FROM inscripciones i WHERE i.curso_id = c.id), 0) AS total_alumnos
		FROM cursos c
		WHERE c.id = ?
	`;
	const [rows] = await pool.execute(query, [parseInt(cursoId, 10)]);
	if (rows.length === 0) return null;

	const row = rows[0];
	const cupoMaximo = row.cupo_maximo || 35;
	const totalAlumnos = Number(row.total_alumnos) || 0;
	const cuposDisponibles = Math.max(0, cupoMaximo - totalAlumnos);
	const porcentajeOcupacion = Math.min(100, Math.round((totalAlumnos / cupoMaximo) * 100));

	let estadoCupo = 'disponible';
	if (cuposDisponibles === 0) {
		estadoCupo = 'completo';
	} else if (totalAlumnos === 0) {
		estadoCupo = 'sin_inscriptos';
	}

	return {
		curso_id: row.curso_id,
		codigo: row.codigo,
		nombre: row.nombre,
		cupo_maximo: cupoMaximo,
		total_alumnos: totalAlumnos,
		cupos_disponibles: cuposDisponibles,
		porcentaje_ocupacion: porcentajeOcupacion,
		estado_cupo: estadoCupo
	};
};

/**
 * Obtiene el registro de inscripción de un alumno específico en un curso.
 * @param {number|string} cursoId 
 * @param {number|string} alumnoId 
 * @returns {Promise<object|null>}
 */
export const getInscripcionCursoAlumno = async (cursoId, alumnoId) => {
	const query = 'SELECT * FROM inscripciones WHERE curso_id = ? AND alumno_id = ?';
	const [rows] = await pool.execute(query, [parseInt(cursoId, 10), parseInt(alumnoId, 10)]);
	return rows.length > 0 ? rows[0] : null;
};

/**
 * Inscribe a un alumno en un curso (HU-45 #115).
 * @param {{ cursoId: number|string, alumnoId: number|string, estado?: string }} data
 * @returns {Promise<number>} ID insertado
 */
export const inscribirAlumnoEnCurso = async ({ cursoId, alumnoId, estado = 'inscripto' }) => {
	const query = 'INSERT INTO inscripciones (curso_id, alumno_id, estado) VALUES (?, ?, ?)';
	const [result] = await pool.execute(query, [
		parseInt(cursoId, 10),
		parseInt(alumnoId, 10),
		estado || 'inscripto'
	]);
	return result.insertId;
};

/**
 * Elimina la inscripción de un alumno de un curso (HU-45 #115).
 * @param {number|string} cursoId 
 * @param {number|string} alumnoId 
 * @returns {Promise<number>} Filas afectadas
 */
export const desinscribirAlumnoDeCurso = async (cursoId, alumnoId) => {
	const query = 'DELETE FROM inscripciones WHERE curso_id = ? AND alumno_id = ?';
	const [result] = await pool.execute(query, [parseInt(cursoId, 10), parseInt(alumnoId, 10)]);
	return result.affectedRows;
};


/**
 * Obtiene la escuela asociada a un curso por su ID (HU-06 #99).
 * @param {number|string} cursoId 
 * @returns {Promise<object|null>}
 */
export const getEscuelaByCursoId = async (cursoId) => {
	const query = `
		SELECT 
			e.id, 
			e.codigo, 
			e.nombre, 
			e.director, 
			e.email_contacto, 
			e.ubicacion
		FROM cursos c
		JOIN escuelas e ON c.escuela_id = e.id
		WHERE c.id = ?
	`;
	const [rows] = await pool.execute(query, [cursoId]);
	return rows.length > 0 ? rows[0] : null;
};

/**
 * Obtiene un curso por su código único.
 * @param {string} codigo 
 * @returns {Promise<object|null>}
 */
export const getCursoByCodigo = async (codigo) => {
	const query = 'SELECT * FROM cursos WHERE codigo = ?';
	const [rows] = await pool.execute(query, [codigo.trim().toUpperCase()]);
	return rows.length > 0 ? rows[0] : null;
};

/**
 * Actualiza los datos de un curso.
 * @param {number|string} id 
 * @param {object} curso 
 * @returns {Promise<number>} Filas afectadas
 */
export const updateCurso = async (id, curso) => {
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
		activo = 1
	} = curso;

	const query = `
		UPDATE cursos 
		SET 
			codigo = ?, 
			nombre = ?, 
			descripcion = ?, 
			escuela_id = ?,
			comision = ?, 
			periodo = ?, 
			aula = ?, 
			horario = ?, 
			cupo_maximo = ?, 
			activo = ?
		WHERE id = ?
	`;

	const [result] = await pool.execute(query, [
		codigo.trim().toUpperCase(),
		nombre.trim(),
		descripcion ? descripcion.trim() : '',
		parseInt(escuela_id, 10) || 1,
		comision ? comision.trim() : 'Comisión A',
		periodo ? periodo.trim() : '2026 - 1° Cuatrimestre',
		aula ? aula.trim() : 'Aula Virtual',
		horario ? horario.trim() : 'Lunes y Miércoles 18:30 - 21:30',
		parseInt(cupo_maximo, 10) || 35,
		activo !== undefined ? (activo ? 1 : 0) : 1,
		id
	]);

	return result.affectedRows;
};

/**
 * Elimina un curso por su ID.
 * @param {number|string} id 
 * @returns {Promise<number>} Filas afectadas
 */
export const deleteCurso = async (id) => {
	const query = 'DELETE FROM cursos WHERE id = ?';
	const [result] = await pool.execute(query, [id]);
	return result.affectedRows;
};

/**
 * Cuenta la cantidad de cursos asignados a un docente.
 * Utilizado para verificar integridad referencial antes de eliminar un usuario docente.
 * @param {number|string} docente_id 
 * @returns {Promise<number>}
 */
export const countCursosByDocente = async (docente_id) => {
	const query = 'SELECT COUNT(*) as count FROM cursos WHERE docente_id = ?';
	const [rows] = await pool.execute(query, [docente_id]);
	return rows[0]?.count || 0;
};
