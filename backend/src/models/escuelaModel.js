import pool from '../config/connection.js';

/**
 * Modelo para la entidad Escuelas (Departamentos / Facultades Académicas).
 * HU-44: Asociar curso a una escuela (#105)
 * Tarea #106: Definir relación escuela-curso.
 */

/**
 * Obtiene todas las escuelas registradas en la institución junto con la cantidad de cursos asociados.
 * @returns {Promise<Array>}
 */
export const getAllEscuelas = async () => {
	const query = `
		SELECT 
			e.id, 
			e.codigo, 
			e.nombre, 
			e.director, 
			e.email_contacto, 
			e.ubicacion, 
			e.fecha_creacion,
			COUNT(c.id) AS total_cursos
		FROM escuelas e
		LEFT JOIN cursos c ON e.id = c.escuela_id
		GROUP BY e.id
		ORDER BY e.nombre ASC
	`;
	const [rows] = await pool.execute(query);
	return rows;
};

/**
 * Obtiene una escuela por su ID.
 * @param {number|string} id 
 * @returns {Promise<object|null>}
 */
export const getEscuelaById = async (id) => {
	const query = `
		SELECT 
			e.id, 
			e.codigo, 
			e.nombre, 
			e.director, 
			e.email_contacto, 
			e.ubicacion, 
			e.fecha_creacion,
			COUNT(c.id) AS total_cursos
		FROM escuelas e
		LEFT JOIN cursos c ON e.id = c.escuela_id
		WHERE e.id = ?
		GROUP BY e.id
	`;
	const [rows] = await pool.execute(query, [id]);
	return rows.length > 0 ? rows[0] : null;
};

/**
 * Obtiene una escuela por su código único.
 * @param {string} codigo 
 * @returns {Promise<object|null>}
 */
export const getEscuelaByCodigo = async (codigo) => {
	const query = 'SELECT * FROM escuelas WHERE codigo = ?';
	const [rows] = await pool.execute(query, [codigo.trim().toUpperCase()]);
	return rows.length > 0 ? rows[0] : null;
};

/**
 * Inserta una nueva escuela.
 * @param {{ codigo: string, nombre: string, director?: string, email_contacto?: string, ubicacion?: string }} data
 * @returns {Promise<number>} ID insertado
 */
export const createEscuela = async ({
	codigo,
	nombre,
	director = '',
	email_contacto = '',
	ubicacion = ''
}) => {
	const query = `
		INSERT INTO escuelas (codigo, nombre, director, email_contacto, ubicacion)
		VALUES (?, ?, ?, ?, ?)
	`;
	const [result] = await pool.execute(query, [
		codigo.trim().toUpperCase(),
		nombre.trim(),
		director ? director.trim() : null,
		email_contacto ? email_contacto.trim() : null,
		ubicacion ? ubicacion.trim() : null
	]);
	return result.insertId;
};

/**
 * Actualiza los datos de una escuela.
 * @param {number|string} id 
 * @param {object} data 
 * @returns {Promise<number>} Filas afectadas
 */
export const updateEscuela = async (id, { codigo, nombre, director, email_contacto, ubicacion }) => {
	const query = `
		UPDATE escuelas 
		SET codigo = ?, nombre = ?, director = ?, email_contacto = ?, ubicacion = ?
		WHERE id = ?
	`;
	const [result] = await pool.execute(query, [
		codigo.trim().toUpperCase(),
		nombre.trim(),
		director ? director.trim() : null,
		email_contacto ? email_contacto.trim() : null,
		ubicacion ? ubicacion.trim() : null,
		id
	]);
	return result.affectedRows;
};

/**
 * Cuenta la cantidad de cursos asignados a una escuela.
 * Utilizado para validar pertenencia e integridad referencial (#106, #109).
 * @param {number|string} escuelaId 
 * @returns {Promise<number>}
 */
export const countCursosByEscuela = async (escuelaId) => {
	const query = 'SELECT COUNT(*) as count FROM cursos WHERE escuela_id = ?';
	const [rows] = await pool.execute(query, [escuelaId]);
	return rows[0]?.count || 0;
};
