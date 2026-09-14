import { jest } from '@jest/globals';

// Mockeamos los modelos antes de importar los controladores
jest.unstable_mockModule('../src/models/publicacionModel.js', () => ({
	createPublicacion: jest.fn(),
	getPublicaciones: jest.fn(),
	getPublicacionById: jest.fn(),
	getPublicacionesByAutorId: jest.fn(),
	updatePublicacion: jest.fn(),
	deletePublicacion: jest.fn(),
	countPublicacionesByAutor: jest.fn()
}));

jest.unstable_mockModule('../src/models/usuarioModel.js', () => ({
	createUsuario: jest.fn(),
	getAllUsuarios: jest.fn(),
	getUsuarioById: jest.fn(),
	getUsuarioByEmail: jest.fn(),
	updateUsuario: jest.fn(),
	updatePassword: jest.fn(),
	updateEmail: jest.fn(),
	deleteUsuario: jest.fn()
}));

const {
	createPublicacionController,
	updatePublicacionController,
	deletePublicacionController
} = await import('../src/controllers/publicacionController.js');

const {
	deleteUsuarioController,
	getPerfilController
} = await import('../src/controllers/usuarioController.js');

const publicacionModel = await import('../src/models/publicacionModel.js');
const usuarioModel = await import('../src/models/usuarioModel.js');

describe('Unit Testing: Propiedad de Datos, Delegación de Identidad y Control de Acceso (403 Forbidden)', () => {
	let req;
	let res;

	beforeEach(() => {
		jest.clearAllMocks();
		req = {
			usuario: { id: 10, email: 'autor@instituto.edu.ar' },
			params: {},
			body: {},
			query: {}
		};
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis()
		};
	});

	describe('Delegación de Identidad al Token (createPublicacionController)', () => {
		test('Debe usar el ID del usuario del token JWT y persistir la publicación', async () => {
			req.usuario = { id: 10, email: 'autor@instituto.edu.ar' };
			req.body = {
				titulo: 'Mi Nuevo Proyecto',
				contenido: 'Descripción detallada del proyecto académico.'
			};

			publicacionModel.createPublicacion.mockResolvedValue(101);

			await createPublicacionController(req, res);

			expect(publicacionModel.createPublicacion).toHaveBeenCalledWith({
				titulo: 'Mi Nuevo Proyecto',
				contenido: 'Descripción detallada del proyecto académico.',
				autor_id: 10
			});
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 101,
					publicacion: expect.objectContaining({
						autor_id: 10
					})
				})
			);
		});
	});

	describe('Control de Propiedad al Modificar (updatePublicacionController)', () => {
		test('Debe responder 403 Forbidden si el usuario intenta modificar una publicación ajena', async () => {
			req.params = { id: '5' };
			req.usuario = { id: 10 }; // Usuario autenticado ID: 10
			req.body = {
				titulo: 'Título Modificado Maliciosamente',
				contenido: 'Intento de alterar datos de otro usuario'
			};

			// La publicación pertenece al usuario ID: 99
			publicacionModel.getPublicacionById.mockResolvedValue({
				id: 5,
				titulo: 'Publicación Original',
				contenido: 'Contenido original',
				autor_id: 99
			});

			await updatePublicacionController(req, res);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: 'Acceso denegado',
					message: expect.stringMatching(/no es el propietario/i)
				})
			);
			expect(publicacionModel.updatePublicacion).not.toHaveBeenCalled();
		});

		test('Debe responder 404 Not Found si la publicación no existe', async () => {
			req.params = { id: '999' };
			req.usuario = { id: 10 };
			req.body = { titulo: 'Nuevo Título', contenido: 'Nuevo Contenido' };

			publicacionModel.getPublicacionById.mockResolvedValue(null);

			await updatePublicacionController(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: 'No encontrado'
				})
			);
		});

		test('Debe permitir la actualización (200 OK) si el usuario es el dueño del recurso', async () => {
			req.params = { id: '5' };
			req.usuario = { id: 10 };
			req.body = {
				titulo: 'Título Actualizado por su Dueño',
				contenido: 'Contenido actualizado correctamente'
			};

			// La publicación pertenece al usuario ID: 10
			publicacionModel.getPublicacionById.mockResolvedValue({
				id: 5,
				titulo: 'Título Anterior',
				contenido: 'Contenido anterior',
				autor_id: 10
			});
			publicacionModel.updatePublicacion.mockResolvedValue(1);

			await updatePublicacionController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(publicacionModel.updatePublicacion).toHaveBeenCalledWith('5', {
				titulo: 'Título Actualizado por su Dueño',
				contenido: 'Contenido actualizado correctamente'
			});
		});
	});

	describe('Control de Propiedad al Eliminar (deletePublicacionController)', () => {
		test('Debe responder 403 Forbidden si el usuario intenta borrar una publicación de otra persona', async () => {
			req.params = { id: '8' };
			req.usuario = { id: 10 };

			// Publicación de otro usuario (ID 77)
			publicacionModel.getPublicacionById.mockResolvedValue({
				id: 8,
				autor_id: 77
			});

			await deletePublicacionController(req, res);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: 'Acceso denegado',
					message: expect.stringMatching(/no es el propietario/i)
				})
			);
			expect(publicacionModel.deletePublicacion).not.toHaveBeenCalled();
		});

		test('Debe permitir eliminar (200 OK) si el usuario es el dueño de la publicación', async () => {
			req.params = { id: '8' };
			req.usuario = { id: 10 };

			publicacionModel.getPublicacionById.mockResolvedValue({
				id: 8,
				autor_id: 10
			});
			publicacionModel.deletePublicacion.mockResolvedValue(1);

			await deletePublicacionController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(publicacionModel.deletePublicacion).toHaveBeenCalledWith('8');
		});
	});

	describe('Protección contra Eliminación de Usuario con Publicaciones Activas', () => {
		test('Debe rechazar la eliminación (409 Conflict) si el usuario tiene publicaciones activas', async () => {
			req.params = { id: '15' };

			usuarioModel.getUsuarioById.mockResolvedValue([{ id: 15, nombre: 'Docente' }]);
			// El usuario tiene 3 publicaciones activas
			publicacionModel.countPublicacionesByAutor.mockResolvedValue(3);

			await deleteUsuarioController(req, res);

			expect(res.status).toHaveBeenCalledWith(409);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: 'Operación denegada',
					message: expect.stringMatching(/posee 3 publicación\(es\) asociada\(s\)/i)
				})
			);
			expect(usuarioModel.deleteUsuario).not.toHaveBeenCalled();
		});

		test('Debe permitir eliminar el usuario si no posee publicaciones asociadas', async () => {
			req.params = { id: '15' };

			usuarioModel.getUsuarioById.mockResolvedValue([{ id: 15, nombre: 'Docente' }]);
			publicacionModel.countPublicacionesByAutor.mockResolvedValue(0);
			usuarioModel.deleteUsuario.mockResolvedValue(1);

			await deleteUsuarioController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(usuarioModel.deleteUsuario).toHaveBeenCalledWith('15');
		});
	});

	describe('Endpoint Estático GET /perfil', () => {
		test('Debe responder con los datos del usuario basándose exclusivamente en el token JWT', async () => {
			req.usuario = { id: 42, email: 'estudiante@instituto.edu.ar' };

			usuarioModel.getUsuarioById.mockResolvedValue([
				{
					id: 42,
					nombre: 'Esteban',
					apellido: 'Genoud',
					email: 'estudiante@instituto.edu.ar',
					rol_id: 1,
					activo: 1,
					fecha_creacion: '2026-03-01'
				}
			]);

			await getPerfilController(req, res);

			expect(usuarioModel.getUsuarioById).toHaveBeenCalledWith(42);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 42,
					nombre: 'Esteban',
					email: 'estudiante@instituto.edu.ar'
				})
			);
		});
	});
});
