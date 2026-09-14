import pool from '../config/connection.js';

/**
 * Modelo para la entidad Publicaciones.
 * Implementa consultas SQL optimizadas, paginación con LIMIT y OFFSET,
 * y búsqueda dinámica con LIKE parametrizado de forma segura.
 */

/**
 * Inserta una nueva publicación en la base de datos.
 * @param {{ titulo: string, contenido: string, autor_id: number }} param0 
 * @returns {Promise<number>} ID de la publicación insertada
 */
export const createPublicacion = async ({ titulo, contenido, autor_id }) => {
	const query = 'INSERT INTO publicaciones (titulo, contenido, autor_id) VALUES (?, ?, ?)';
	const [result] = await pool.execute(query, [titulo, contenido, autor_id]);
	return result.insertId;
};

/**
 * Obtiene publicaciones con soporte para búsqueda dinámica (LIKE) y paginación (LIMIT y OFFSET).
 * @param {{ search?: string, page?: number|string, limit?: number|string }} options
 * @returns {Promise<{ data: Array, pagination: { total: number, page: number, limit: number, totalPages: number } }>}
 */
export const getPublicaciones = async ({ search = '', page = 1, limit = 10 } = {}) => {
	const safePage = Math.max(1, parseInt(page, 10) || 1);
	const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
	const offset = (safePage - 1) * safeLimit;

	let countQuery = 'SELECT COUNT(*) as total FROM publicaciones p JOIN usuarios u ON p.autor_id = u.id';
	let dataQuery = `
		SELECT 
			p.id, 
			p.titulo, 
			p.contenido, 
			p.autor_id, 
			p.fecha_creacion, 
			p.fecha_actualizacion,
			u.nombre AS autor_nombre,
			u.apellido AS autor_apellido,
			u.email AS autor_email
		FROM publicaciones p
		JOIN usuarios u ON p.autor_id = u.id
	`;

	const countParams = [];
	const dataParams = [];

	if (search && search.trim() !== '') {
		const searchPattern = `%${search.trim()}%`;
		const whereClause = ' WHERE (p.titulo LIKE ? OR p.contenido LIKE ?)';
		countQuery += whereClause;
		dataQuery += whereClause;

		countParams.push(searchPattern, searchPattern);
		dataParams.push(searchPattern, searchPattern);
	}

	// Ordenamiento por fecha descendente
	dataQuery += ` ORDER BY p.fecha_creacion DESC LIMIT ${safeLimit} OFFSET ${offset}`;

	// Ejecutar consulta de conteo y datos en paralelo
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
 * Obtiene una publicación por su ID con datos del autor.
 * @param {number|string} id 
 * @returns {Promise<object|null>}
 */
export const getPublicacionById = async (id) => {
	const query = `
		SELECT 
			p.id, 
			p.titulo, 
			p.contenido, 
			p.autor_id, 
			p.fecha_creacion, 
			p.fecha_actualizacion,
			u.nombre AS autor_nombre,
			u.apellido AS autor_apellido,
			u.email AS autor_email
		FROM publicaciones p
		JOIN usuarios u ON p.autor_id = u.id
		WHERE p.id = ?
	`;
	const [rows] = await pool.execute(query, [id]);
	return rows.length > 0 ? rows[0] : null;
};

/**
 * Obtiene publicaciones creadas por un autor específico.
 * @param {number|string} autor_id 
 * @returns {Promise<Array>}
 */
export const getPublicacionesByAutorId = async (autor_id) => {
	const query = 'SELECT * FROM publicaciones WHERE autor_id = ? ORDER BY fecha_creacion DESC';
	const [rows] = await pool.execute(query, [autor_id]);
	return rows;
};

/**
 * Actualiza título y contenido de una publicación.
 * @param {number|string} id 
 * @param {{ titulo: string, contenido: string }} param1 
 * @returns {Promise<number>} Cantidad de filas afectadas
 */
export const updatePublicacion = async (id, { titulo, contenido }) => {
	const query = 'UPDATE publicaciones SET titulo = ?, contenido = ? WHERE id = ?';
	const [result] = await pool.execute(query, [titulo, contenido, id]);
	return result.affectedRows;
};

/**
 * Elimina una publicación por su ID.
 * @param {number|string} id 
 * @returns {Promise<number>} Cantidad de filas afectadas
 */
export const deletePublicacion = async (id) => {
	const query = 'DELETE FROM publicaciones WHERE id = ?';
	const [result] = await pool.execute(query, [id]);
	return result.affectedRows;
};

/**
 * Cuenta la cantidad de publicaciones asociadas a un autor.
 * Utilizado para verificar integridad antes de borrar un usuario.
 * @param {number|string} autor_id 
 * @returns {Promise<number>}
 */
export const countPublicacionesByAutor = async (autor_id) => {
	const query = 'SELECT COUNT(*) as count FROM publicaciones WHERE autor_id = ?';
	const [rows] = await pool.execute(query, [autor_id]);
	return rows[0]?.count || 0;
};
