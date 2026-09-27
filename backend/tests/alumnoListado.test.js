import { jest } from '@jest/globals';

// Mockeamos la capa de modelos
jest.unstable_mockModule('../src/models/alumnoModel.js', () => ({
	getAlumnos: jest.fn(),
	buscarAlumnos: jest.fn(),
	getAlumnoById: jest.fn(),
	getCursosInscriptosByAlumnoId: jest.fn(),
	getCalificacionesByAlumnoId: jest.fn(),
	getEvaluacionesByAlumnoId: jest.fn(),
	getResumenAcademicoByAlumnoId: jest.fn(),
	getPerfilCompletoAlumnoById: jest.fn(),
	getHistorialAcademicoByAlumnoId: jest.fn(),
	verificarDocenteAsignadoAAlumno: jest.fn()
}));

const {
	obtenerAlumnosService,
	obtenerMisAlumnosDocenteService,
	obtenerAlumnosPorCursoService
} = await import('../src/services/alumnoService.js');

const {
	getAllAlumnosController,
	getMisAlumnosController,
	getAlumnosByCursoController
} = await import('../src/controllers/alumnoController.js');

const alumnoModel = await import('../src/models/alumnoModel.js');

describe('HU-07: Visualizar listado de alumnos (#118)', () => {
	let req, res;

	beforeEach(() => {
		jest.clearAllMocks();

		req = {
			params: {},
			body: {},
			query: {},
			usuario: { id: 1, nombre: 'Admin', rol_id: 2 }
		};

		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis()
		};
	});

	describe('Tarea #119: Crear modelo de alumno & #122 Implementar listado', () => {
		test('obtenerAlumnosService: retorna el listado de alumnos con paginación y metadatos', async () => {
			const mockAlumnos = [
				{
					id: 4,
					nombre: 'Lucas',
					apellido: 'Martínez',
					nombre_completo: 'Lucas Martínez',
					email: 'lucas.martinez@instituto.edu.ar',
					legajo: 'ALU-2026-0004',
					carrera: 'Tecnicatura Superior en Desarrollo de Software',
					total_cursos: 3,
					promedio_general: 8.50,
					desempeno: 'Excelente',
					acceso_perfil: { perfil_url: '/api/v1/alumnos/4/perfil' }
				},
				{
					id: 5,
					nombre: 'Camila',
					apellido: 'Álvarez',
					nombre_completo: 'Camila Álvarez',
					email: 'camila.alvarez@instituto.edu.ar',
					legajo: 'ALU-2026-0005',
					carrera: 'Tecnicatura Superior en Desarrollo de Software',
					total_cursos: 2,
					promedio_general: 7.00,
					desempeno: 'Muy Bueno',
					acceso_perfil: { perfil_url: '/api/v1/alumnos/5/perfil' }
				}
			];

			alumnoModel.getAlumnos.mockResolvedValue({
				data: mockAlumnos,
				pagination: { total: 2, page: 1, limit: 10, totalPages: 1 }
			});

			const result = await obtenerAlumnosService({ search: '', page: 1, limit: 10 });

			expect(result.data).toHaveLength(2);
			expect(result.pagination.total).toBe(2);
			expect(result.data[0].legajo).toBe('ALU-2026-0004');
			expect(result.data[0].promedio_general).toBe(8.50);
		});

		test('obtenerAlumnosService: maneja lista vacía cuando no hay coincidencias de búsqueda', async () => {
			alumnoModel.getAlumnos.mockResolvedValue({
				data: [],
				pagination: { total: 0, page: 1, limit: 10, totalPages: 1 }
			});

			const result = await obtenerAlumnosService({ search: 'Inexistente' });

			expect(result.data).toHaveLength(0);
			expect(result.pagination.total).toBe(0);
		});
	});

	describe('Tarea #120: Crear relación alumno-curso', () => {
		test('obtenerAlumnosPorCursoService: consulta alumnos filtrando por curso_id', async () => {
			alumnoModel.getAlumnos.mockResolvedValue({
				data: [{ id: 4, nombre: 'Lucas', legajo: 'ALU-2026-0004' }],
				pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
			});

			const result = await obtenerAlumnosPorCursoService(1, { page: 1, limit: 10 });

			expect(alumnoModel.getAlumnos).toHaveBeenCalledWith(expect.objectContaining({
				curso_id: 1
			}));
			expect(result.data).toHaveLength(1);
		});

		test('obtenerMisAlumnosDocenteService: consulta alumnos filtrando por docente_id', async () => {
			alumnoModel.getAlumnos.mockResolvedValue({
				data: [
					{ id: 4, nombre: 'Lucas', legajo: 'ALU-2026-0004' },
					{ id: 5, nombre: 'Camila', legajo: 'ALU-2026-0005' }
				],
				pagination: { total: 2, page: 1, limit: 10, totalPages: 1 }
			});

			const result = await obtenerMisAlumnosDocenteService(2, { page: 1, limit: 10 });

			expect(alumnoModel.getAlumnos).toHaveBeenCalledWith(expect.objectContaining({
				docente_id: 2
			}));
			expect(result.data).toHaveLength(2);
		});

		test('obtenerMisAlumnosDocenteService: retorna lista vacía si docenteId es nulo', async () => {
			const result = await obtenerMisAlumnosDocenteService(null);

			expect(result.data).toEqual([]);
			expect(result.pagination.total).toBe(0);
		});
	});

	describe('Tarea #121: Crear endpoint de alumnos & Controladores', () => {
		test('getAllAlumnosController: responde 200 con el listado de alumnos', async () => {
			req.query = { search: 'Martínez', page: '1', limit: '10' };
			alumnoModel.getAlumnos.mockResolvedValue({
				data: [{ id: 4, nombre: 'Lucas', apellido: 'Martínez' }],
				pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
			});

			await getAllAlumnosController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
				data: expect.any(Array),
				pagination: expect.objectContaining({ total: 1 })
			}));
		});

		test('getMisAlumnosController: responde 401 si no hay usuario en el token', async () => {
			req.usuario = null;

			await getMisAlumnosController(req, res);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
				error: 'No autenticado'
			}));
		});

		test('getMisAlumnosController: responde 200 con los alumnos del docente autenticado', async () => {
			req.usuario = { id: 2, rol_id: 1 };
			alumnoModel.getAlumnos.mockResolvedValue({
				data: [{ id: 4, nombre: 'Lucas' }],
				pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
			});

			await getMisAlumnosController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
				docente_id: 2,
				data: expect.any(Array)
			}));
		});

		test('getAlumnosByCursoController: responde 200 con los alumnos del curso', async () => {
			req.params.cursoId = '1';
			alumnoModel.getAlumnos.mockResolvedValue({
				data: [{ id: 4, nombre: 'Lucas' }],
				pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
			});

			await getAlumnosByCursoController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
				data: expect.any(Array)
			}));
		});
	});

	describe('Tarea #127: Crear acceso al perfil', () => {
		test('Cada alumno en el listado incluye URLs estructuradas de acceso a su perfil y calificaciones', async () => {
			alumnoModel.getAlumnos.mockResolvedValue({
				data: [
					{
						id: 4,
						nombre: 'Lucas',
						legajo: 'ALU-2026-0004',
						acceso_perfil: {
							perfil_url: '/api/v1/alumnos/4/perfil',
							calificaciones_url: '/api/v1/alumnos/4/calificaciones',
							evaluaciones_url: '/api/v1/alumnos/4/evaluaciones',
							resumen_url: '/api/v1/alumnos/4/resumen-academico'
						}
					}
				],
				pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
			});

			const result = await obtenerAlumnosService({});

			expect(result.data[0].acceso_perfil.perfil_url).toBe('/api/v1/alumnos/4/perfil');
			expect(result.data[0].acceso_perfil.calificaciones_url).toBe('/api/v1/alumnos/4/calificaciones');
			expect(result.data[0].acceso_perfil.resumen_url).toBe('/api/v1/alumnos/4/resumen-academico');
		});
	});

	describe('Tarea #129: Probar listado & Manejo de errores', () => {
		test('getAllAlumnosController: responde 500 en caso de error no controlado en base de datos', async () => {
			alumnoModel.getAlumnos.mockRejectedValue(new Error('DB Connection Lost'));

			await getAllAlumnosController(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
				error: 'Error interno del servidor'
			}));
		});
	});
});
