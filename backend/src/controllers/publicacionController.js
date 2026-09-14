import {
	createPublicacion,
	getPublicaciones,
	getPublicacionById,
	updatePublicacion,
	deletePublicacion
} from '../models/publicacionModel.js';

/**
 * Crea una nueva publicación.
 * DELEGACIÓN DE IDENTIDAD: Extrae autor_id exclusivamente del JWT autenticado (req.usuario.id).
 * Ignora cualquier autor_id enviado en el cuerpo de la petición.
 */
export const createPublicacionController = async (req, res) => {
	try {
		const { titulo, contenido } = req.body || {};
		const autor_id = req.usuario?.id;

		if (!autor_id) {
			return res.status(401).json({
				error: 'No autenticado',
				message: 'No se pudo determinar la identidad del autor a partir del token'
			});
		}

		const newId = await createPublicacion({
			titulo: titulo.trim(),
			contenido: contenido.trim(),
			autor_id
		});

		res.status(201).json({
			id: newId,
			message: 'Publicación creada exitosamente',
			publicacion: {
				id: newId,
				titulo: titulo.trim(),
				contenido: contenido.trim(),
				autor_id
			}
		});
	} catch (error) {
		console.error('Error al crear publicación:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * Obtiene publicaciones con paginación (page, limit) y búsqueda dinámica (search).
 */
export const getPublicacionesController = async (req, res) => {
	try {
		const { search, page, limit } = req.query;
		const result = await getPublicaciones({ search, page, limit });
		res.status(200).json(result);
	} catch (error) {
		console.error('Error al obtener publicaciones:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * Obtiene una publicación por su ID.
 */
export const getPublicacionByIdController = async (req, res) => {
	try {
		const { id } = req.params;
		const publicacion = await getPublicacionById(id);

		if (!publicacion) {
			return res.status(404).json({
				error: 'No encontrado',
				message: `No se encontró ninguna publicación con el ID ${id}`
			});
		}

		res.status(200).json(publicacion);
	} catch (error) {
		console.error('Error al obtener publicación por ID:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * Actualiza una publicación.
 * PROPIEDAD DE DATOS: Verifica en la base de datos si el autor_id coincide con el req.usuario.id.
 * Si no coincide, rechaza con 403 Forbidden.
 */
export const updatePublicacionController = async (req, res) => {
	try {
		const { id } = req.params;
		const { titulo, contenido } = req.body || {};
		const usuarioId = req.usuario?.id;

		const publicacionExistente = await getPublicacionById(id);

		if (!publicacionExistente) {
			return res.status(404).json({
				error: 'No encontrado',
				message: `No se encontró ninguna publicación con el ID ${id}`
			});
		}

		// Verificación estricta de propiedad de datos
		if (publicacionExistente.autor_id !== usuarioId) {
			return res.status(403).json({
				error: 'Acceso denegado',
				message: 'No tiene permisos para modificar esta publicación (no es el propietario del recurso)'
			});
		}

		await updatePublicacion(id, {
			titulo: titulo.trim(),
			contenido: contenido.trim()
		});

		res.status(200).json({
			message: 'Publicación actualizada exitosamente',
			id: Number(id),
			publicacion: {
				id: Number(id),
				titulo: titulo.trim(),
				contenido: contenido.trim(),
				autor_id: usuarioId
			}
		});
	} catch (error) {
		console.error('Error al actualizar publicación:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};

/**
 * Elimina una publicación.
 * PROPIEDAD DE DATOS: Verifica en la base de datos si el autor_id coincide con el req.usuario.id.
 * Si no coincide, rechaza con 403 Forbidden.
 */
export const deletePublicacionController = async (req, res) => {
	try {
		const { id } = req.params;
		const usuarioId = req.usuario?.id;

		const publicacionExistente = await getPublicacionById(id);

		if (!publicacionExistente) {
			return res.status(404).json({
				error: 'No encontrado',
				message: `No se encontró ninguna publicación con el ID ${id}`
			});
		}

		// Verificación estricta de propiedad de datos
		if (publicacionExistente.autor_id !== usuarioId) {
			return res.status(403).json({
				error: 'Acceso denegado',
				message: 'No tiene permisos para eliminar esta publicación (no es el propietario del recurso)'
			});
		}

		await deletePublicacion(id);

		res.status(200).json({
			message: 'Publicación eliminada exitosamente',
			id: Number(id)
		});
	} catch (error) {
		console.error('Error al eliminar publicación:', error);
		res.status(500).json({ error: 'Error interno del servidor', details: error.message });
	}
};
