import { jest } from '@jest/globals';
import {
	validateRegister,
	validateLoginInput,
	validatePasswordUpdate,
	validateEmailUpdate,
	validatePublicacion
} from '../src/middlewares/validate.middleware.js';

describe('Unit Testing con Mocks en Express: Middlewares de Validación RegEx', () => {
	let req;
	let res;
	let next;

	beforeEach(() => {
		req = {
			body: {}
		};
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis()
		};
		next = jest.fn();
	});

	describe('Middleware validateRegister', () => {
		test('Debe rechazar con status 400 si el nombre es inválido o muy corto', () => {
			req.body = {
				nombre: 'A',
				apellido: 'Gómez',
				email: 'carlos@test.com',
				password: 'Password123!'
			};

			validateRegister(req, res, next);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: 'Validación fallida',
					field: 'nombre'
				})
			);
			expect(next).not.toHaveBeenCalled();
		});

		test('Debe rechazar con status 400 si el apellido es inválido o muy corto', () => {
			req.body = {
				nombre: 'Carlos',
				apellido: '',
				email: 'carlos@test.com',
				password: 'Password123!'
			};

			validateRegister(req, res, next);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: 'Validación fallida',
					field: 'apellido'
				})
			);
			expect(next).not.toHaveBeenCalled();
		});

		test('Debe rechazar la petición con status 400 si la contraseña es débil (sin caracteres especiales ni mayúsculas)', () => {
			req.body = {
				nombre: 'Carlos',
				apellido: 'Gómez',
				email: 'carlos@test.com',
				password: 'password123'
			};

			validateRegister(req, res, next);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: 'Validación fallida',
					field: 'password'
				})
			);
			expect(next).not.toHaveBeenCalled();
		});

		test('Debe rechazar con status 400 si el email no cumple la RegEx', () => {
			req.body = {
				nombre: 'Carlos',
				apellido: 'Gómez',
				email: 'email_invalido_sin_arroba',
				password: 'Password123!'
			};

			validateRegister(req, res, next);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: 'Validación fallida',
					field: 'email'
				})
			);
			expect(next).not.toHaveBeenCalled();
		});

		test('Debe llamar a next() si todos los campos son válidos y robustos', () => {
			req.body = {
				nombre: 'Carlos',
				apellido: 'Gómez',
				email: 'carlos.gomez@test.com',
				password: 'ClaveSegura2026!'
			};

			validateRegister(req, res, next);

			expect(next).toHaveBeenCalledTimes(1);
			expect(res.status).not.toHaveBeenCalled();
		});
	});

	describe('Middleware validateLoginInput', () => {
		test('Debe rechazar con 400 si faltan credenciales', () => {
			req.body = { email: '' };

			validateLoginInput(req, res, next);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(next).not.toHaveBeenCalled();
		});

		test('Debe rechazar con 400 si el email tiene formato erróneo', () => {
			req.body = { email: 'bademail', password: '123' };

			validateLoginInput(req, res, next);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({ field: 'email' })
			);
			expect(next).not.toHaveBeenCalled();
		});

		test('Debe llamar a next() si el login tiene formato de email válido', () => {
			req.body = { email: 'admin@instituto.edu.ar', password: 'Admin123!' };

			validateLoginInput(req, res, next);

			expect(next).toHaveBeenCalledTimes(1);
		});
	});

	describe('Middleware validatePasswordUpdate', () => {
		test('Debe rechazar con 400 si la nueva contraseña no cumple los requisitos', () => {
			req.body = { password: 'simple' };

			validatePasswordUpdate(req, res, next);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(next).not.toHaveBeenCalled();
		});

		test('Debe llamar a next() con contraseña robusta', () => {
			req.body = { password: 'NuevaPassword2026!' };

			validatePasswordUpdate(req, res, next);

			expect(next).toHaveBeenCalledTimes(1);
		});
	});

	describe('Middleware validateEmailUpdate', () => {
		test('Debe rechazar con 400 si el nuevo email no es válido', () => {
			req.body = { email: 'invalido' };

			validateEmailUpdate(req, res, next);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(next).not.toHaveBeenCalled();
		});

		test('Debe llamar a next() con email válido', () => {
			req.body = { email: 'nuevo.email@instituto.edu.ar' };

			validateEmailUpdate(req, res, next);

			expect(next).toHaveBeenCalledTimes(1);
		});
	});

	describe('Middleware validatePublicacion y Delegación de Identidad', () => {
		test('Debe eliminar autor_id del body para evitar suplantación de identidad', () => {
			req.body = {
				titulo: 'Novedades de Clase',
				contenido: 'Contenido completo sobre la materia y proyectos.',
				autor_id: 9999 // intento de inyección maliciosa
			};

			validatePublicacion(req, res, next);

			expect(req.body.autor_id).toBeUndefined();
			expect(next).toHaveBeenCalledTimes(1);
		});

		test('Debe rechazar con status 400 si el título es demasiado corto o está vacío', () => {
			req.body = {
				titulo: 'ab',
				contenido: 'Contenido válido de la publicación'
			};

			validatePublicacion(req, res, next);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: 'Validación fallida',
					field: 'titulo'
				})
			);
			expect(next).not.toHaveBeenCalled();
		});

		test('Debe rechazar con status 400 si el contenido está vacío', () => {
			req.body = {
				titulo: 'Título válido',
				contenido: '   '
			};

			validatePublicacion(req, res, next);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: 'Validación fallida',
					field: 'contenido'
				})
			);
			expect(next).not.toHaveBeenCalled();
		});
	});
});
