import pool from '../config/connection.js';
import bcrypt from 'bcrypt';

/**
 * Modelo de Usuarios con soporte para búsqueda dinámica, paginación
 * y hash seguro de contraseñas.
 */

const getAllUsuarios = async ({ search = '', page = 1, limit = 10 } = {}) => {
	const safePage = Math.max(1, parseInt(page, 10) || 1);
	const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
	const offset = (safePage - 1) * safeLimit;

	let countQuery = 'SELECT COUNT(*) as total FROM usuarios';
	let dataQuery = 'SELECT id, nombre, apellido, email, rol_id, activo, fecha_creacion, fecha_actualizacion FROM usuarios';

	const countParams = [];
	const dataParams = [];

	if (search && search.trim() !== '') {
		const searchPattern = `%${search.trim()}%`;
		const whereClause = ' WHERE (nombre LIKE ? OR apellido LIKE ? OR email LIKE ?)';
		countQuery += whereClause;
		dataQuery += whereClause;

		countParams.push(searchPattern, searchPattern, searchPattern);
		dataParams.push(searchPattern, searchPattern, searchPattern);
	}

	dataQuery += ` ORDER BY id ASC LIMIT ${safeLimit} OFFSET ${offset}`;

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

const getUsuarioById = async (id) => {
	const query = 'SELECT id, nombre, apellido, email, rol_id, activo, fecha_creacion, fecha_actualizacion FROM usuarios WHERE id = ?';
	const [result] = await pool.execute(query, [id]);
	return result;
};

const getUsuarioByEmail = async (email) => {
	const query = 'SELECT * FROM usuarios WHERE email = ?';
	const [result] = await pool.execute(query, [email]);
	return result;
};

const createUsuario = async (user) => {
	const { nombre, apellido, email, password, rol_id = 1, activo = 1 } = user;
	const query = 'INSERT INTO usuarios (nombre, apellido, email, contrasena, rol_id, activo) VALUES (?, ?, ?, ?, ?, ?)';

	const passwordHash = await bcrypt.hash(password, 10);
	const [result] = await pool.execute(query, [
		nombre,
		apellido,
		email,
		passwordHash,
		rol_id,
		activo
	]);
	return result.insertId;
};

const updateUsuario = async (id, user) => {
	const { nombre, apellido, email } = user;
	const query = 'UPDATE usuarios SET nombre = ?, apellido = ?, email = ? WHERE id = ?';
	const [result] = await pool.execute(query, [nombre, apellido, email, id]);
	return result.affectedRows;
};

const deleteUsuario = async (id) => {
	const query = 'DELETE FROM usuarios WHERE id = ?';
	const [result] = await pool.execute(query, [id]);
	return result.affectedRows;
};

const updatePassword = async (id, rawPassword) => {
	const passwordHash = await bcrypt.hash(rawPassword, 10);
	const query = 'UPDATE usuarios SET contrasena = ? WHERE id = ?';
	const [result] = await pool.execute(query, [passwordHash, id]);
	return result.affectedRows;
};

const updateEmail = async (id, email) => {
	const query = 'UPDATE usuarios SET email = ? WHERE id = ?';
	const [result] = await pool.execute(query, [email, id]);
	return result.affectedRows;
};

export {
	createUsuario,
	getAllUsuarios,
	getUsuarioById,
	getUsuarioByEmail,
	updateUsuario,
	updatePassword,
	updateEmail,
	deleteUsuario
};
