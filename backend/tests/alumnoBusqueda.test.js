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
	buscarAlumnosService
} = await import('../src/services/alumnoService.js');

const {
	getAllAlumnosController,
	buscarAlumnosController
} = await import('../src/controllers/alumnoController.js');

const alumnoModel = await import('../src/models/alumnoModel.js');

describe('HU-08: Buscar alumno (#130)', () => {
	let req, res;

	const mockAlumnosEncontrados = [
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
			activo: true,
			acceso_perfil: {
				perfil_url: '/api/v1/alumnos/4/perfil',
				calificaciones_url: '/api/v1/alumnos/4/calificaciones',
				evaluaciones_url: '/api/v1/alumnos/4/evaluaciones',
				resumen_url: '/api/v1/alumnos/4/resumen-academico',
				historial_url: '/api/v1/alumnos/4/historial-academico'
			}
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
			promedio_general: 7.25,
			desempeno: 'Muy Bueno',
			activo: true,
			acceso_perfil: {
				perfil_url: '/api/v1/alumnos/5/perfil',
				calificaciones_url: '/api/v1/alumnos/5/calificaciones',
				evaluaciones_url: '/api/v1/alumnos/5/evaluaciones',
				resumen_url: '/api/v1/alumnos/5/resumen-academico',
				historial_url: '/api/v1/alumnos/5/historial-academico'
			}
		}
	];

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

	describe('Tarea #131: Crear parámetro de búsqueda', () => {
		test('buscarAlumnosService: busca por término general unificado (search o q)', async () => {
			alumnoModel.getAlumnos.mockResolvedValue({
				data: [mockAlumnosEncontrados[0]],
				pagination: { total: 1, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false },
				mensaje: 'Se encontraron 1 alumnos',
				filtros_aplicados: { search: 'Lucas' }
			});

			const result = await buscarAlumnosService({ search: 'Lucas' });

			expect(alumnoModel.getAlumnos).toHaveBeenCalledWith({ search: 'Lucas' });
			expect(result.data.length).toBe(1);
			expect(result.data[0].nombre).toBe('Lucas');
			expect(result.filtros_aplicados.search).toBe('Lucas');
		});

		test('buscarAlumnosService: busca por número o formato de legajo (ALU-2026-0004)', async () => {
			alumnoModel.getAlumnos.mockResolvedValue({
				data: [mockAlumnosEncontrados[0]],
				pagination: { total: 1, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false },
				mensaje: 'Se encontraron 1 alumnos',
				filtros_aplicados: { legajo: 'ALU-2026-0004' }
			});

			const result = await buscarAlumnosService({ legajo: 'ALU-2026-0004' });

			expect(alumnoModel.getAlumnos).toHaveBeenCalledWith({ legajo: 'ALU-2026-0004' });
			expect(result.data[0].legajo).toBe('ALU-2026-0004');
		});

		test('buscarAlumnosService: busca por email institucional', async () => {
			alumnoModel.getAlumnos.mockResolvedValue({
				data: [mockAlumnosEncontrados[1]],
				pagination: { total: 1, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false },
				mensaje: 'Se encontraron 1 alumnos',
				filtros_aplicados: { email: 'camila.alvarez@instituto.edu.ar' }
			});

			const result = await buscarAlumnosService({ email: 'camila.alvarez@instituto.edu.ar' });

			expect(result.data[0].email).toBe('camila.alvarez@instituto.edu.ar');
		});
	});

	describe('Tarea #136: Implementar filtrado', () => {
		test('buscarAlumnosService: filtra por curso_id y estado de cursada', async () => {
			alumnoModel.getAlumnos.mockResolvedValue({
				data: mockAlumnosEncontrados,
				pagination: { total: 2, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false },
				mensaje: 'Se encontraron 2 alumnos',
				filtros_aplicados: { curso_id: 1, estado: 'inscripto' }
			});

			const result = await buscarAlumnosService({ curso_id: 1, estado: 'inscripto' });

			expect(alumnoModel.getAlumnos).toHaveBeenCalledWith({ curso_id: 1, estado: 'inscripto' });
			expect(result.data.length).toBe(2);
			expect(result.filtros_aplicados.curso_id).toBe(1);
			expect(result.filtros_aplicados.estado).toBe('inscripto');
		});

		test('buscarAlumnosService: filtra por rango de promedio_min y nivel de desempeño', async () => {
			alumnoModel.getAlumnos.mockResolvedValue({
				data: [mockAlumnosEncontrados[0]],
				pagination: { total: 1, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false },
				mensaje: 'Se encontraron 1 alumnos',
				filtros_aplicados: { promedio_min: 8.0, desempeno: 'Excelente' }
			});

			const result = await buscarAlumnosService({ promedio_min: 8.0, desempeno: 'Excelente' });

			expect(result.data[0].promedio_general).toBeGreaterThanOrEqual(8.0);
			expect(result.data[0].desempeno).toBe('Excelente');
		});

		test('buscarAlumnosService: aplica ordenamiento dinámico por promedio descendente', async () => {
			alumnoModel.getAlumnos.mockResolvedValue({
				data: mockAlumnosEncontrados,
				pagination: { total: 2, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false },
				mensaje: 'Se encontraron 2 alumnos',
				filtros_aplicados: { sortBy: 'promedio_general', sortOrder: 'DESC' }
			});

			const result = await buscarAlumnosService({ sortBy: 'promedio_general', sortOrder: 'DESC' });

			expect(alumnoModel.getAlumnos).toHaveBeenCalledWith({ sortBy: 'promedio_general', sortOrder: 'DESC' });
			expect(result.filtros_aplicados.sortBy).toBe('promedio_general');
			expect(result.filtros_aplicados.sortOrder).toBe('DESC');
		});
	});

	describe('Tarea #137: Manejar resultados vacíos', () => {
		test('buscarAlumnosService: retorna array vacío, totalPages: 0 y mensaje amigable ante búsqueda sin coincidencias', async () => {
			alumnoModel.getAlumnos.mockResolvedValue({
				data: [],
				pagination: {
					total: 0,
					page: 1,
					limit: 10,
					totalPages: 0,
					hasNextPage: false,
					hasPrevPage: false
				},
				mensaje: 'No se encontraron alumnos que coincidan con los criterios de búsqueda especificados',
				filtros_aplicados: { search: 'NombreInexistente999' }
			});

			const result = await buscarAlumnosService({ search: 'NombreInexistente999' });

			expect(result.data).toEqual([]);
			expect(result.pagination.total).toBe(0);
			expect(result.pagination.totalPages).toBe(0);
			expect(result.pagination.hasNextPage).toBe(false);
			expect(result.mensaje).toContain('No se encontraron alumnos');
			expect(result.filtros_aplicados.search).toBe('NombreInexistente999');
		});
	});

	describe('Tarea #138: Probar búsquedas (Controladores y Rutas)', () => {
		test('buscarAlumnosController: responde con 200 OK y listado filtrado al llamar a GET /api/v1/alumnos/buscar', async () => {
			req.query = { q: 'Lucas', curso_id: '1' };

			alumnoModel.getAlumnos.mockResolvedValue({
				data: [mockAlumnosEncontrados[0]],
				pagination: { total: 1, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false },
				mensaje: 'Se encontraron 1 alumnos',
				filtros_aplicados: { q: 'Lucas', curso_id: '1' }
			});

			await buscarAlumnosController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
				data: expect.arrayContaining([expect.objectContaining({ nombre: 'Lucas' })]),
				mensaje: expect.any(String),
				pagination: expect.any(Object),
				filtros_aplicados: expect.any(Object)
			}));
		});

		test('getAllAlumnosController: delega parámetros query a obtenerAlumnosService y responde 200', async () => {
			req.query = { search: 'Álvarez', page: '1', limit: '5' };

			alumnoModel.getAlumnos.mockResolvedValue({
				data: [mockAlumnosEncontrados[1]],
				pagination: { total: 1, page: 1, limit: 5, totalPages: 1, hasNextPage: false, hasPrevPage: false },
				mensaje: 'Se encontraron 1 alumnos',
				filtros_aplicados: { search: 'Álvarez' }
			});

			await getAllAlumnosController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
				data: expect.arrayContaining([expect.objectContaining({ apellido: 'Álvarez' })])
			}));
		});

		test('buscarAlumnosController: maneja errores de base de datos respondiendo 500', async () => {
			req.query = { search: 'Error' };
			alumnoModel.getAlumnos.mockRejectedValue(new Error('DB Query Timeout'));

			await buscarAlumnosController(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
				error: 'Error interno del servidor'
			}));
		});
	});
});
