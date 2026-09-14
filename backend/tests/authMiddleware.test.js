import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../src/middlewares/authToken.middleware.js';

describe('Unit Testing con Mocks en Express: Middleware de Autenticación (verifyToken)', () => {
	const secretKey = 'test_jwt_secret_key';
	let originalSecret;

	beforeAll(() => {
		originalSecret = process.env.JWT_SECRET;
		process.env.JWT_SECRET = secretKey;
	});

	afterAll(() => {
		process.env.JWT_SECRET = originalSecret;
	});

	let req;
	let res;
	let next;

	beforeEach(() => {
		req = {
			headers: {}
		};
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis()
		};
		next = jest.fn();
	});

	test('Debe rechazar la petición con status 401 si no se envía el header Authorization', () => {
		req.headers = {};

		verifyToken(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: 'Acceso denegado',
				message: expect.stringMatching(/no proporcionado/i)
			})
		);
		expect(next).not.toHaveBeenCalled();
	});

	test('Debe rechazar la petición con status 401 si el token está vacío tras "Bearer "', () => {
		req.headers = { authorization: 'Bearer ' };

		verifyToken(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: 'Token no válido'
			})
		);
		expect(next).not.toHaveBeenCalled();
	});

	test('Debe rechazar con status 401 si el token es inválido o fue manipulado', () => {
		req.headers = { authorization: 'Bearer token_invalido_falso_123' };

		verifyToken(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: 'Autenticación fallida'
			})
		);
		expect(next).not.toHaveBeenCalled();
	});

	test('Debe rechazar con status 401 si el token ha expirado', () => {
		const expiredToken = jwt.sign(
			{ id: 1, email: 'expirado@test.com' },
			secretKey,
			{ expiresIn: '0s' }
		);

		req.headers = { authorization: `Bearer ${expiredToken}` };

		verifyToken(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: 'Token expirado'
			})
		);
		expect(next).not.toHaveBeenCalled();
	});

	test('Debe decodificar el token válido, inyectar req.usuario y llamar a next()', () => {
		const userPayload = { id: 42, email: 'estudiante@instituto.edu.ar', rol_id: 1 };
		const validToken = jwt.sign(userPayload, secretKey, { expiresIn: '1h' });

		req.headers = { authorization: `Bearer ${validToken}` };

		verifyToken(req, res, next);

		expect(req.usuario).toBeDefined();
		expect(req.usuario.id).toBe(42);
		expect(req.usuario.email).toBe('estudiante@instituto.edu.ar');
		expect(next).toHaveBeenCalledTimes(1);
		expect(res.status).not.toHaveBeenCalled();
	});
});
