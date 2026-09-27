import { jest } from '@jest/globals';

// Mockeamos el modelo de cursos
jest.unstable_mockModule('../src/models/cursoModel.js', () => ({
	createCurso: jest.fn(),
	getCursos: jest.fn(),
	getCursosByDocenteId: jest.fn(),
	getCursosByEscuelaId: jest.fn(),
	getCursoById: jest.fn(),
	getCursoDetalleById: jest.fn(),
	getAlumnosByCursoId: jest.fn(),
	getCantidadAlumnosByCursoId: jest.fn(),
	getEstadisticasCapacidadCurso: jest.fn(),
	getInscripcionCursoAlumno: jest.fn(),
	inscribirAlumnoEnCurso: jest.fn(),
	desinscribirAlumnoDeCurso: jest.fn(),
	getEscuelaByCursoId: jest.fn(),
	getCursoByCodigo: jest.fn(),
	asociarCursoAEscuela: jest.fn(),
	updateCurso: jest.fn(),
	deleteCurso: jest.fn(),
	countCursosByDocente: jest.fn()
}));

jest.unstable_mockModule('../src/models/escuelaModel.js', () => ({
	getAllEscuelas: jest.fn(),
	getEscuelaById: jest.fn().mockResolvedValue({ id: 1, nombre: 'Escuela de Informática' }),
	getEscuelaByCodigo: jest.fn(),
	createEscuela: jest.fn(),
	updateEscuela: jest.fn(),
	countCursosByEscuela: jest.fn()
}));



const {
	getAllCursosController,
	getCursosDocenteController,
	getCursosByDocenteIdController,
	getCursoByIdController,
	createCursoController,
	updateCursoController,
	deleteCursoController
} = await import('../src/controllers/cursoController.js');

const cursoModel = await import('../src/models/cursoModel.js');

describe('Integration / Unit Testing: Endpoints y Controladores de Cursos (HU-04 #78, #79, #83, #84)', () => {
	let req;
	let res;

	beforeEach(() => {
		jest.clearAllMocks();
		req = {
			usuario: { id: 1, email: 'admin@instituto.edu.ar', rol_id: 2 },
			params: {},
			body: {},
			query: {}
		};
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis()
		};
	});

	describe('GET /api/v1/cursos (getAllCursosController) - #78', () => {
		test('Debe listar todos los cursos con paginación y retornar 200 OK', async () => {
			req.query = { page: '1', limit: '10' };
			const mockResult = {
				data: [
					{ id: 1, codigo: 'DSW-301', nombre: 'Desarrollo de Sistemas Web' }
				],
				pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
			};

			cursoModel.getCursos.mockResolvedValue(mockResult);

			await getAllCursosController(req, res);

			expect(cursoModel.getCursos).toHaveBeenCalledWith({
				search: undefined,
				docente_id: undefined,
				page: '1',
				limit: '10',
				activo: undefined
			});
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(mockResult);
		});
	});

	describe('GET /api/v1/cursos/mis-cursos (getCursosDocenteController) - #79, #83', () => {
		test('Debe obtener los cursos del docente autenticado utilizando el ID del Token JWT', async () => {
			req.usuario = { id: 2, email: 'juan.perez@instituto.edu.ar', rol_id: 1 };
			req.query = { search: 'Algoritmos' };

			const mockResult = {
				data: [
					{ id: 4, codigo: 'AYED-101', nombre: 'Algoritmos y Estructuras de Datos', docente_id: 2 }
				],
				pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
			};

			cursoModel.getCursosByDocenteId.mockResolvedValue(mockResult);

			await getCursosDocenteController(req, res);

			expect(cursoModel.getCursosByDocenteId).toHaveBeenCalledWith(2, {
				search: 'Algoritmos',
				page: undefined,
				limit: undefined,
				activo: undefined
			});
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				...mockResult,
				docente_id: 2
			});
		});

		test('Debe retornar lista vacía (data: []) y total: 0 cuando el docente no tiene cursos asignados (#83 Estado Vacío)', async () => {
			req.usuario = { id: 99, email: 'sin.cursos@instituto.edu.ar' };
			const emptyResult = {
				data: [],
				pagination: { total: 0, page: 1, limit: 10, totalPages: 1 }
			};

			cursoModel.getCursosByDocenteId.mockResolvedValue(emptyResult);

			await getCursosDocenteController(req, res);

			expect(cursoModel.getCursosByDocenteId).toHaveBeenCalledWith(99, expect.any(Object));
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				...emptyResult,
				docente_id: 99
			});
			expect(res.json.mock.calls[0][0].data).toHaveLength(0);
		});

		test('Debe responder 401 si no hay usuario autenticado en la petición', async () => {
			req.usuario = null;

			await getCursosDocenteController(req, res);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({ error: 'No autenticado' })
			);
		});
	});

	describe('GET /api/v1/cursos/docente/:docenteId (getCursosByDocenteIdController)', () => {
		test('Debe obtener cursos del docente indicado por parámetro', async () => {
			req.params = { docenteId: '3' };
			const mockResult = {
				data: [],
				pagination: { total: 0, page: 1, limit: 10, totalPages: 1 }
			};

			cursoModel.getCursosByDocenteId.mockResolvedValue(mockResult);

			await getCursosByDocenteIdController(req, res);

			expect(cursoModel.getCursosByDocenteId).toHaveBeenCalledWith('3', expect.any(Object));
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(mockResult);
		});
	});

	describe('GET /api/v1/cursos/:id (getCursoByIdController)', () => {
		test('Debe retornar 200 OK con los datos del curso si existe', async () => {
			req.params = { id: '1' };
			const mockCourse = {
				id: 1,
				codigo: 'DSW-301',
				nombre: 'Desarrollo de Sistemas Web',
				docente_id: 1,
				docente_nombre: 'Admin'
			};

			cursoModel.getCursoById.mockResolvedValue(mockCourse);

			await getCursoByIdController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(mockCourse);
		});

		test('Debe responder 404 Not Found si el curso no existe', async () => {
			req.params = { id: '999' };
			cursoModel.getCursoById.mockResolvedValue(null);

			await getCursoByIdController(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({ error: 'No encontrado' })
			);
		});
	});

	describe('POST /api/v1/cursos (createCursoController)', () => {
		test('Debe crear un nuevo curso asociándolo al docente del token JWT', async () => {
			req.usuario = { id: 2, email: 'juan.perez@instituto.edu.ar', rol_id: 1 };
			req.body = {
				codigo: 'NUEVO-101',
				nombre: 'Nuevo Curso de Programación',
				descripcion: 'Descripción del curso',
				comision: 'Comisión A',
				periodo: '2026 - 1C',
				aula: 'Lab 1',
				horario: 'Lunes 18:00',
				cupo_maximo: 30,
				activo: 1
			};

			cursoModel.getCursoByCodigo.mockResolvedValue(null);
			cursoModel.createCurso.mockResolvedValue(15);

			await createCursoController(req, res);

			expect(cursoModel.createCurso).toHaveBeenCalledWith(
				expect.objectContaining({
					codigo: 'NUEVO-101',
					nombre: 'Nuevo Curso de Programación',
					docente_id: 2
				})
			);
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 15,
					message: 'Curso creado exitosamente',
					curso: expect.objectContaining({
						id: 15,
						docente_id: 2
					})
				})
			);
		});

		test('Debe responder 409 Conflict si ya existe un curso con el mismo código', async () => {
			req.usuario = { id: 1, rol_id: 2 };
			req.body = { codigo: 'DSW-301', nombre: 'Curso Duplicado' };

			cursoModel.getCursoByCodigo.mockResolvedValue({ id: 1, codigo: 'DSW-301' });

			await createCursoController(req, res);

			expect(res.status).toHaveBeenCalledWith(409);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: 'Conflicto',
					message: expect.stringMatching(/ya existe un curso/i)
				})
			);
			expect(cursoModel.createCurso).not.toHaveBeenCalled();
		});
	});

	describe('PUT /api/v1/cursos/:id (updateCursoController)', () => {
		test('Debe responder 403 Forbidden si el docente intenta modificar un curso que no es suyo', async () => {
			req.params = { id: '1' };
			req.usuario = { id: 3, rol_id: 1 }; // Docente ID 3 (no es admin)
			req.body = { codigo: 'DSW-301', nombre: 'Intento de modificar' };

			// Curso pertenece al Docente ID 1
			cursoModel.getCursoById.mockResolvedValue({
				id: 1,
				codigo: 'DSW-301',
				nombre: 'Desarrollo Web',
				docente_id: 1
			});

			await updateCursoController(req, res);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: 'Acceso denegado',
					message: expect.stringMatching(/no tiene permisos/i)
				})
			);
			expect(cursoModel.updateCurso).not.toHaveBeenCalled();
		});

		test('Debe permitir la actualización (200 OK) si el usuario es el docente titular', async () => {
			req.params = { id: '1' };
			req.usuario = { id: 1, rol_id: 1 };
			req.body = {
				codigo: 'DSW-301',
				nombre: 'Desarrollo de Sistemas Web Avanzado'
			};

			cursoModel.getCursoById.mockResolvedValue({
				id: 1,
				codigo: 'DSW-301',
				nombre: 'Desarrollo Web',
				docente_id: 1
			});
			cursoModel.updateCurso.mockResolvedValue(1);

			await updateCursoController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(cursoModel.updateCurso).toHaveBeenCalled();
		});
	});

	describe('DELETE /api/v1/cursos/:id (deleteCursoController)', () => {
		test('Debe responder 403 Forbidden si el usuario no es el titular ni administrador', async () => {
			req.params = { id: '2' };
			req.usuario = { id: 4, rol_id: 1 };

			cursoModel.getCursoById.mockResolvedValue({
				id: 2,
				docente_id: 1
			});

			await deleteCursoController(req, res);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(cursoModel.deleteCurso).not.toHaveBeenCalled();
		});

		test('Debe permitir eliminar el curso (200 OK) si es el docente titular', async () => {
			req.params = { id: '2' };
			req.usuario = { id: 1, rol_id: 1 };

			cursoModel.getCursoById.mockResolvedValue({
				id: 2,
				docente_id: 1
			});
			cursoModel.deleteCurso.mockResolvedValue(1);

			await deleteCursoController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(cursoModel.deleteCurso).toHaveBeenCalledWith('2');
		});
	});
});
