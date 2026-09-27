import { jest } from '@jest/globals';

// Mockeamos la capa de datos de escuelas y cursos
jest.unstable_mockModule('../src/models/escuelaModel.js', () => ({
	getAllEscuelas: jest.fn(),
	getEscuelaById: jest.fn(),
	getEscuelaByCodigo: jest.fn(),
	createEscuela: jest.fn(),
	updateEscuela: jest.fn(),
	countCursosByEscuela: jest.fn()
}));

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

const {
	obtenerEscuelasService,
	obtenerEscuelaPorIdService,
	obtenerCursosPorEscuelaService,
	asociarCursoAEscuelaService
} = await import('../src/services/escuelaService.js');

const {
	getAllEscuelasController,
	getEscuelaByIdController,
	getCursosDeEscuelaController,
	asociarCursoEscuelaController
} = await import('../src/controllers/escuelaController.js');

const {
	asociarEscuelaController
} = await import('../src/controllers/cursoController.js');

const escuelaModel = await import('../src/models/escuelaModel.js');
const cursoModel = await import('../src/models/cursoModel.js');

describe('Test Suite: HU-44 Asociar Curso a una Escuela (#105, #106, #108, #109, #111)', () => {
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

	describe('Tarea #106: Definir Relación Escuela-Curso y Catálogo de Escuelas', () => {
		test('Debe listar todas las escuelas con el total de cursos asociados (200 OK)', async () => {
			const mockEscuelas = [
				{
					id: 1,
					codigo: 'ESC-INF',
					nombre: 'Escuela de Informática y Tecnología',
					director: 'Dr. Roberto Gómez',
					email_contacto: 'informatica@instituto.edu.ar',
					ubicacion: 'Campus Norte',
					total_cursos: 4
				},
				{
					id: 2,
					codigo: 'ESC-ING',
					nombre: 'Escuela de Ingeniería de Software',
					director: 'Ing. Patricia Rossi',
					email_contacto: 'ingenieria@instituto.edu.ar',
					ubicacion: 'Pabellón B',
					total_cursos: 2
				}
			];

			escuelaModel.getAllEscuelas.mockResolvedValue(mockEscuelas);

			await getAllEscuelasController(req, res);

			expect(escuelaModel.getAllEscuelas).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				status: 200,
				total: 2,
				data: mockEscuelas
			});
		});

		test('Debe obtener una escuela específica por su ID (200 OK)', async () => {
			const mockEscuela = {
				id: 1,
				codigo: 'ESC-INF',
				nombre: 'Escuela de Informática y Tecnología',
				director: 'Dr. Roberto Gómez',
				email_contacto: 'informatica@instituto.edu.ar',
				total_cursos: 3
			};

			escuelaModel.getEscuelaById.mockResolvedValue(mockEscuela);
			req.params = { id: '1' };

			await getEscuelaByIdController(req, res);

			expect(escuelaModel.getEscuelaById).toHaveBeenCalledWith('1');
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(mockEscuela);
		});

		test('Debe responder 404 Not Found si la escuela solicitada no existe', async () => {
			escuelaModel.getEscuelaById.mockResolvedValue(null);
			req.params = { id: '999' };

			await getEscuelaByIdController(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: 'No encontrado',
					message: expect.stringMatching(/no se encontró ninguna escuela/i)
				})
			);
		});

		test('Debe obtener los cursos pertenecientes a una escuela específica (200 OK)', async () => {
			escuelaModel.getEscuelaById.mockResolvedValue({
				id: 1,
				codigo: 'ESC-INF',
				nombre: 'Escuela de Informática y Tecnología'
			});

			const mockCursosResult = {
				data: [
					{ id: 1, codigo: 'DSW-301', nombre: 'Desarrollo de Sistemas Web', escuela_id: 1 },
					{ id: 2, codigo: 'BD-201', nombre: 'Bases de Datos', escuela_id: 1 }
				],
				pagination: { total: 2, page: 1, limit: 10, totalPages: 1 }
			};

			cursoModel.getCursosByEscuelaId.mockResolvedValue(mockCursosResult);

			req.params = { id: '1' };
			req.query = { page: '1', limit: '10' };

			await getCursosDeEscuelaController(req, res);

			expect(cursoModel.getCursosByEscuelaId).toHaveBeenCalledWith('1', {
				search: undefined,
				page: '1',
				limit: '10',
				activo: undefined
			});
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					success: true,
					escuela_id: 1,
					escuela_nombre: 'Escuela de Informática y Tecnología',
					data: mockCursosResult.data
				})
			);
		});
	});

	describe('Tarea #108 & #109: Implementar Asociación y Validar Pertenencia de la Escuela', () => {
		test('Debe permitir (200 OK) al docente titular asociar su curso a una escuela válida', async () => {
			req.usuario = { id: 2, email: 'juan.perez@instituto.edu.ar', rol_id: 1 }; // Docente Titular
			req.params = { id: '4' };
			req.body = { escuela_id: 2 };

			// Curso perteneciente al docente ID 2
			cursoModel.getCursoById.mockResolvedValue({
				id: 4,
				codigo: 'AYED-101',
				nombre: 'Algoritmos y Estructuras de Datos',
				docente_id: 2,
				escuela_id: 1
			});

			// Escuela destino existente
			escuelaModel.getEscuelaById.mockResolvedValue({
				id: 2,
				codigo: 'ESC-ING',
				nombre: 'Escuela de Ingeniería de Software'
			});

			cursoModel.asociarCursoAEscuela.mockResolvedValue(1);
			cursoModel.getCursoDetalleById.mockResolvedValue({
				id: 4,
				codigo: 'AYED-101',
				nombre: 'Algoritmos y Estructuras de Datos',
				docente_id: 2,
				escuela_id: 2,
				escuela: { id: 2, nombre: 'Escuela de Ingeniería de Software' }
			});

			await asociarEscuelaController(req, res);

			expect(cursoModel.asociarCursoAEscuela).toHaveBeenCalledWith('4', 2);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					success: true,
					message: expect.stringMatching(/asociado exitosamente/i),
					data: expect.objectContaining({
						curso_id: 4,
						escuela_id: 2
					})
				})
			);
		});

		test('Debe permitir (200 OK) a un administrador asociar cualquier curso a una escuela', async () => {
			req.usuario = { id: 1, email: 'admin@instituto.edu.ar', rol_id: 2 }; // Administrador
			req.params = { id: '3' };
			req.body = { escuela_id: 1 };

			cursoModel.getCursoById.mockResolvedValue({
				id: 3,
				codigo: 'ING-202',
				nombre: 'Ingeniería de Software I',
				docente_id: 2, // Pertenece a docente 2, pero el admin puede gestionarlo
				escuela_id: 2
			});

			escuelaModel.getEscuelaById.mockResolvedValue({
				id: 1,
				codigo: 'ESC-INF',
				nombre: 'Escuela de Informática y Tecnología'
			});

			cursoModel.asociarCursoAEscuela.mockResolvedValue(1);
			cursoModel.getCursoDetalleById.mockResolvedValue({
				id: 3,
				codigo: 'ING-202',
				nombre: 'Ingeniería de Software I',
				escuela_id: 1
			});

			await asociarEscuelaController(req, res);

			expect(cursoModel.asociarCursoAEscuela).toHaveBeenCalledWith('3', 1);
			expect(res.status).toHaveBeenCalledWith(200);
		});

		test('Debe rechazar con 401 Unauthorized si la petición no incluye token de autenticación (#109)', async () => {
			req.usuario = null;
			req.params = { id: '1' };
			req.body = { escuela_id: 2 };

			await asociarEscuelaController(req, res);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: 'No autenticado'
				})
			);
			expect(cursoModel.asociarCursoAEscuela).not.toHaveBeenCalled();
		});

		test('Debe rechazar con 403 Forbidden si un docente intenta asociar un curso que NO le pertenece (#109)', async () => {
			req.usuario = { id: 5, email: 'otro.docente@instituto.edu.ar', rol_id: 1 }; // Docente ID 5
			req.params = { id: '1' };
			req.body = { escuela_id: 2 };

			// Curso perteneciente a Docente ID 2
			cursoModel.getCursoById.mockResolvedValue({
				id: 1,
				codigo: 'DSW-301',
				docente_id: 2
			});

			await asociarEscuelaController(req, res);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: 'Acceso denegado',
					message: expect.stringMatching(/no tiene permisos/i)
				})
			);
			expect(cursoModel.asociarCursoAEscuela).not.toHaveBeenCalled();
		});

		test('Debe rechazar con 404 Not Found si la escuela especificada NO existe en la base de datos (#109)', async () => {
			req.usuario = { id: 2, email: 'juan.perez@instituto.edu.ar', rol_id: 1 };
			req.params = { id: '4' };
			req.body = { escuela_id: 999 }; // Escuela inexistente

			cursoModel.getCursoById.mockResolvedValue({
				id: 4,
				codigo: 'AYED-101',
				docente_id: 2
			});

			// Escuela 999 no existe
			escuelaModel.getEscuelaById.mockResolvedValue(null);

			await asociarEscuelaController(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: 'No encontrado',
					message: expect.stringMatching(/no se encontró ninguna escuela registrada con el id 999/i)
				})
			);
			expect(cursoModel.asociarCursoAEscuela).not.toHaveBeenCalled();
		});

		test('Debe rechazar con 400 Bad Request si el identificador de escuela es inválido (#109)', async () => {
			req.usuario = { id: 2, rol_id: 1 };
			req.params = { id: '4' };
			req.body = { escuela_id: -5 }; // ID negativo inválido

			cursoModel.getCursoById.mockResolvedValue({
				id: 4,
				docente_id: 2
			});

			await asociarEscuelaController(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: 'Petición incorrecta'
				})
			);
		});
	});
});
