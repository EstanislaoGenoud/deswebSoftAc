import pool from '../config/connection.js';

/**
 * Modelo para la entidad Inscripciones (Matriculación de Alumnos).
 * HU-45: Registrar cantidad de alumnos del curso (#112)
 * Tareas: #113 (Crear consulta), #114 (Mostrar cantidad), #115 (Actualizar automáticamente), #117 (Probar).
 */

/**
 * Registra/Inscribe un alumno en un curso.
 * @param {{ cursoId: number|string, alumnoId: number|string, estado?: string }} data
 * @returns {Promise<number>} ID de la inscripción insertada
 */
export const createInscripcion = async ({ cursoId, alumnoId, estado = 'inscripto' }) => {
	const query = `
		INSERT INTO inscripciones (curso_id, alumno_id, estado)
		VALUES (?, ?, ?)
	`;
	const [result] = await pool.execute(query, [
		parseInt(cursoId, 10),
		parseInt(alumnoId, 10),
		estado || 'inscripto'
	]);
	return result.insertId;
};

/**
 * Elimina/Desinscribe un alumno de un curso.
 * @param {number|string} cursoId 
 * @param {number|string} alumnoId 
 * @returns {Promise<number>} Filas afectadas
 */
export const deleteInscripcion = async (cursoId, alumnoId) => {
	const query = 'DELETE FROM inscripciones WHERE curso_id = ? AND alumno_id = ?';
	const [result] = await pool.execute(query, [parseInt(cursoId, 10), parseInt(alumnoId, 10)]);
	return result.affectedRows;
};

/**
 * Obtiene la inscripción de un alumno específico en un curso.
 * @param {number|string} cursoId 
 * @param {number|string} alumnoId 
 * @returns {Promise<object|null>}
 */
export const getInscripcionByCursoYAlumno = async (cursoId, alumnoId) => {
	const query = 'SELECT * FROM inscripciones WHERE curso_id = ? AND alumno_id = ?';
	const [rows] = await pool.execute(query, [parseInt(cursoId, 10), parseInt(alumnoId, 10)]);
	return rows.length > 0 ? rows[0] : null;
};

/**
 * Cuenta la cantidad exacta de alumnos inscriptos en un curso (#113).
 * @param {number|string} cursoId 
 * @returns {Promise<number>}
 */
export const countInscripcionesByCursoId = async (cursoId) => {
	const query = 'SELECT COUNT(*) as count FROM inscripciones WHERE curso_id = ?';
	const [rows] = await pool.execute(query, [parseInt(cursoId, 10)]);
	return rows[0]?.count || 0;
};

/**
 * Obtiene el listado completo de alumnos inscriptos con sus datos personales.
 * @param {number|string} cursoId 
 * @returns {Promise<Array>}
 */
export const getAlumnosInscriptosByCursoId = async (cursoId) => {
	const query = `
		SELECT 
			u.id AS alumno_id,
			u.nombre,
			u.apellido,
			u.email,
			i.id AS inscripcion_id,
			i.estado,
			i.fecha_inscripcion
		FROM inscripciones i
		JOIN usuarios u ON i.alumno_id = u.id
		WHERE i.curso_id = ?
		ORDER BY u.apellido ASC, u.nombre ASC
	`;
	const [rows] = await pool.execute(query, [parseInt(cursoId, 10)]);
	return rows;
};
