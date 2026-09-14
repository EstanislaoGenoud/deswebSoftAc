import {
	createUsuario,
	getAllUsuarios,
	getUsuarioById,
	getUsuarioByEmail,
	updateUsuario,
	updatePassword,
	updateEmail,
	deleteUsuario
} from '../models/usuarioModel.js';
import { countPublicacionesByAutor } from '../models/publicacionModel.js';

const getAllUsuariosController = async (req, res) => {
	try {
		const { search, page, limit } = req.query;
		const result = await getAllUsuarios({ search, page, limit });
		res.status(200).json(result);
	} catch (error) {
		console.error('Error al obtener usuarios:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

const getUsuarioByIdController = async (req, res) => {
	try {
		const { id } = req.params;
		const rows = await getUsuarioById(id);
		const usuario = rows && rows.length > 0 ? rows[0] : null;

		if (!usuario) {
			return res.status(404).json({
				error: 'No encontrado',
				message: `No se encontró ningún usuario con el ID ${id}`
			});
		}

		res.status(200).json(usuario);
	} catch (error) {
		console.error('Error al obtener usuario por ID:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

const getUsuarioByEmailController = async (req, res) => {
	try {
		const { email } = req.params;
		const rows = await getUsuarioByEmail(email);
		const usuario = rows && rows.length > 0 ? rows[0] : null;

		if (!usuario) {
			return res.status(404).json({
				error: 'No encontrado',
				message: `No se encontró ningún usuario con el correo ${email}`
			});
		}

		// Excluir contraseña de la respuesta
		const { contrasena, ...sanitizedUser } = usuario;
		res.status(200).json(sanitizedUser);
	} catch (error) {
		console.error('Error al obtener usuario por email:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * Endpoint estático para ver el perfil del usuario autenticado.
 * SEGURIDAD: Confía EXCLUSIVAMENTE en el ID del Token JWT (req.usuario.id).
 * Ignora cualquier parámetro de URL del usuario, previniendo vulnerabilidades IDOR/BOLA.
 */
const getPerfilController = async (req, res) => {
	try {
		const usuarioId = req.usuario?.id;

		if (!usuarioId) {
			return res.status(401).json({
				error: 'No autenticado',
				message: 'No se pudo identificar al usuario desde el token JWT'
			});
		}

		const rows = await getUsuarioById(usuarioId);
		const usuarioEncontrado = rows && rows.length > 0 ? rows[0] : null;

		if (!usuarioEncontrado) {
			return res.status(404).json({
				error: 'No encontrado',
				message: 'El usuario asociado al token no existe en el sistema'
			});
		}

		// Retorna datos de perfil sin exponer la contraseña hasheada
		res.status(200).json({
			id: usuarioEncontrado.id,
			nombre: usuarioEncontrado.nombre,
			apellido: usuarioEncontrado.apellido,
			email: usuarioEncontrado.email,
			rol_id: usuarioEncontrado.rol_id,
			activo: usuarioEncontrado.activo,
			fecha_creacion: usuarioEncontrado.fecha_creacion
		});
	} catch (error) {
		console.error('Error al obtener perfil:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

const createUsuarioController = async (req, res) => {
	try {
		const { nombre, apellido, email, password, rol_id = 1, activo = 1 } = req.body || {};

		// Verificar si el email ya existe
		const existing = await getUsuarioByEmail(email);
		if (existing && existing.length > 0) {
			return res.status(409).json({
				error: 'Conflicto',
				message: 'El correo electrónico ya se encuentra registrado'
			});
		}

		const newId = await createUsuario({ nombre, apellido, email, password, rol_id, activo });

		res.status(201).json({
			id: newId,
			message: 'Usuario creado exitosamente',
			user: {
				id: newId,
				nombre,
				apellido,
				email,
				rol_id,
				activo
			}
		});
	} catch (error) {
		console.error('Error al crear usuario:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

const updateUsuarioController = async (req, res) => {
	try {
		const { id } = req.params;
		const { nombre, apellido, email } = req.body || {};

		const existing = await getUsuarioById(id);
		if (!existing || existing.length === 0) {
			return res.status(404).json({
				error: 'No encontrado',
				message: `No se encontró ningún usuario con el ID ${id}`
			});
		}

		await updateUsuario(id, { nombre, apellido, email });
		res.status(200).json({
			message: 'Usuario actualizado exitosamente',
			id: Number(id)
		});
	} catch (error) {
		console.error('Error al actualizar usuario:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

const updatePasswordController = async (req, res) => {
	try {
		const { id } = req.params;
		const { password } = req.body || {};

		const existing = await getUsuarioById(id);
		if (!existing || existing.length === 0) {
			return res.status(404).json({
				error: 'No encontrado',
				message: `No se encontró ningún usuario con el ID ${id}`
			});
		}

		await updatePassword(id, password);
		res.status(200).json({
			message: 'Contraseña actualizada exitosamente',
			id: Number(id)
		});
	} catch (error) {
		console.error('Error al actualizar contraseña:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

const updateEmailController = async (req, res) => {
	try {
		const { id } = req.params;
		const { email } = req.body || {};

		const existing = await getUsuarioById(id);
		if (!existing || existing.length === 0) {
			return res.status(404).json({
				error: 'No encontrado',
				message: `No se encontró ningún usuario con el ID ${id}`
			});
		}

		await updateEmail(id, email);
		res.status(200).json({
			message: 'Correo electrónico actualizado exitosamente',
			id: Number(id)
		});
	} catch (error) {
		console.error('Error al actualizar correo:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * Elimina un usuario del sistema.
 * INTEGRIDAD Y PROTECCIÓN: Previene la eliminación si el usuario posee publicaciones activas.
 */
const deleteUsuarioController = async (req, res) => {
	try {
		const { id } = req.params;

		const existing = await getUsuarioById(id);
		if (!existing || existing.length === 0) {
			return res.status(404).json({
				error: 'No encontrado',
				message: `No se encontró ningún usuario con el ID ${id}`
			});
		}

		// Protección de integridad referencial a nivel de aplicación
		const numPublicaciones = await countPublicacionesByAutor(id);
		if (numPublicaciones > 0) {
			return res.status(409).json({
				error: 'Operación denegada',
				message: `No se puede eliminar el usuario porque posee ${numPublicaciones} publicación(es) asociada(s). Integridad referencial protegida.`
			});
		}

		await deleteUsuario(id);
		res.status(200).json({
			message: 'Usuario eliminado exitosamente',
			id: Number(id)
		});
	} catch (error) {
		// Captura de error de clave foránea a nivel de base de datos (ON DELETE RESTRICT)
		if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
			return res.status(409).json({
				error: 'Violación de Integridad Referencial',
				message: 'No se puede eliminar el usuario porque existen registros asociados en otras tablas.'
			});
		}
		console.error('Error al eliminar usuario:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

export {
	getAllUsuariosController,
	getUsuarioByIdController,
	getUsuarioByEmailController,
	getPerfilController,
	createUsuarioController,
	updateUsuarioController,
	updatePasswordController,
	updateEmailController,
	deleteUsuarioController
};