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
	validarAccesoAlumno,
	obtenerHistorialAcademicoService
} = await import('../src/services/alumnoService.js');

const {
	getMiHistorialAcademicoController,
	getHistorialAcademicoController
} = await import('../src/controllers/alumnoController.js');

const alumnoModel = await import('../src/models/alumnoModel.js');

describe('HU-10: Consultar historial académico (#151)', () => {
	let req, res;

	const mockHistorialData = {
		alumno: {
			id: 4,
			legajo: 'ALU-2026-0004',
			carrera: 'Tecnicatura Superior en Desarrollo de Software',
			nombre: 'Lucas',
			apellido: 'Martínez',
			nombre_completo: 'Lucas Martínez',
			email: 'lucas.martinez@instituto.edu.ar',
			activo: true,
			fecha_ingreso: '2025-03-01',
			estado_matricula: 'Activo'
		},
		resumen_historial: {
			total_materias_cursadas: 5,
			materias_aprobadas: 2,
			materias_regulares: 1,
			materias_en_curso: 2,
			materias_desaprobadas: 0,
			cursos_anteriores_count: 3,
			cursos_actuales_count: 2,
			promedio_historico_general: 8.50,
			porcentaje_avance_carrera: 10,
			desempeno_historico: 'Excelente'
		},
		historial_por_periodo: {
			'2025 - 1° Cuatrimestre': [
				{
					curso_id: 5,
					codigo: 'PROG-101',
					nombre: 'Programación I',
					periodo: '2025 - 1° Cuatrimestre',
					tipo_periodo: 'anterior',
					estado_cursada: 'promocionado',
					condicion_final: 'Promocionada',
					promedio_curso: 9.50,
					docente: { id: 2, nombre_completo: 'Juan Perez', email: 'juan.perez@instituto.edu.ar' },
					escuela: { id: 1, codigo: 'ESC-INF', nombre: 'Escuela de Informática y Tecnología' },
					calificaciones: [
						{ evaluacion_nombre: 'Examen Final de Programación I', nota: 9.50, estado: 'Aprobado' }
					]
				}
			],
			'2025 - 2° Cuatrimestre': [
				{
					curso_id: 6,
					codigo: 'ARQ-102',
					nombre: 'Arquitectura de Computadoras',
					periodo: '2025 - 2° Cuatrimestre',
					tipo_periodo: 'anterior',
					estado_cursada: 'regular',
					condicion_final: 'Regularizada',
					promedio_curso: 7.50,
					docente: { id: 1, nombre_completo: 'Admin Sistema', email: 'admin@instituto.edu.ar' },
					escuela: { id: 1, codigo: 'ESC-INF', nombre: 'Escuela de Informática y Tecnología' },
					calificaciones: [
						{ evaluacion_nombre: 'Examen Final de Arquitectura', nota: 7.50, estado: 'Aprobado' }
					]
				}
			],
			'2026 - 1° Cuatrimestre': [
				{
					curso_id: 1,
					codigo: 'DSW-301',
					nombre: 'Desarrollo de Sistemas Web',
					periodo: '2026 - 1° Cuatrimestre',
					tipo_periodo: 'actual',
					estado_cursada: 'inscripto',
					condicion_final: 'Aprobada',
					promedio_curso: 8.75,
					docente: { id: 1, nombre_completo: 'Admin Sistema', email: 'admin@instituto.edu.ar' },
					escuela: { id: 1, codigo: 'ESC-INF', nombre: 'Escuela de Informática y Tecnología' },
					calificaciones: [
						{ evaluacion_nombre: 'Primer Examen Parcial', nota: 8.50, estado: 'Aprobado' },
						{ evaluacion_nombre: 'Trabajo Práctico N° 1', nota: 9.00, estado: 'Aprobado' }
					]
				}
			]
		},
		cursos_anteriores: [
			{ curso_id: 5, codigo: 'PROG-101', nombre: 'Programación I', tipo_periodo: 'anterior' },
			{ curso_id: 6, codigo: 'ARQ-102', nombre: 'Arquitectura de Computadoras', tipo_periodo: 'anterior' }
		],
		cursos_actuales: [
			{ curso_id: 1, codigo: 'DSW-301', nombre: 'Desarrollo de Sistemas Web', tipo_periodo: 'actual' }
		],
		todos_los_cursos: [
			{ curso_id: 5, codigo: 'PROG-101', nombre: 'Programación I' },
			{ curso_id: 6, codigo: 'ARQ-102', nombre: 'Arquitectura de Computadoras' },
			{ curso_id: 1, codigo: 'DSW-301', nombre: 'Desarrollo de Sistemas Web' }
		]
	};

	beforeEach(() => {
		jest.clearAllMocks();

		req = {
			params: {},
			body: {},
			query: {},
			usuario: { id: 4, nombre: 'Lucas', apellido: 'Martínez', rol_id: 1 }
		};

		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis()
		};
	});

	describe('Tarea #153: Definir relación alumno → cursos anteriores & Lógica de Servicios', () => {
		test('obtenerHistorialAcademicoService: rechaza con 401 si no hay usuario autenticado', async () => {
			const result = await obtenerHistorialAcademicoService(4, null);

			expect(result.success).toBe(false);
			expect(result.status).toBe(401);
			expect(result.error).toBe('No autenticado');
		});

		test('obtenerHistorialAcademicoService: rechaza con 400 si el ID de alumno no es válido', async () => {
			const result = await obtenerHistorialAcademicoService('abc', { id: 1, rol_id: 2 });

			expect(result.success).toBe(false);
			expect(result.status).toBe(400);
			expect(result.message).toContain('número entero positivo');
		});

		test('obtenerHistorialAcademicoService: rechaza con 404 si el alumno no existe en el sistema', async () => {
			alumnoModel.getAlumnoById.mockResolvedValue(null);

			const result = await obtenerHistorialAcademicoService(999, { id: 999, rol_id: 1 });

			expect(result.success).toBe(false);
			expect(result.status).toBe(404);
			expect(result.message).toContain('No se encontró ningún alumno');
		});

		test('obtenerHistorialAcademicoService: rechaza con 403 Forbidden a docente ajeno que no le da clases al alumno', async () => {
			alumnoModel.verificarDocenteAsignadoAAlumno.mockResolvedValue(false);

			const docenteAjeno = { id: 3, nombre: 'Maria', apellido: 'Gomez', rol_id: 1 };
			const result = await obtenerHistorialAcademicoService(4, docenteAjeno);

			expect(result.success).toBe(false);
			expect(result.status).toBe(403);
			expect(result.error).toBe('Acceso denegado');
		});

		test('obtenerHistorialAcademicoService: permite acceso 200 OK al propio alumno autenticado', async () => {
			alumnoModel.getAlumnoById.mockResolvedValue({ id: 4, nombre: 'Lucas', apellido: 'Martínez' });
			alumnoModel.getHistorialAcademicoByAlumnoId.mockResolvedValue(mockHistorialData);

			const result = await obtenerHistorialAcademicoService(4, { id: 4, rol_id: 1 });

			expect(result.success).toBe(true);
			expect(result.status).toBe(200);
			expect(result.data.alumno.id).toBe(4);
			expect(result.data.resumen_historial.total_materias_cursadas).toBe(5);
			expect(result.data.cursos_anteriores.length).toBe(2);
			expect(result.data.cursos_actuales.length).toBe(1);
			expect(result.data.historial_por_periodo['2025 - 1° Cuatrimestre']).toBeDefined();
		});

		test('obtenerHistorialAcademicoService: permite acceso 200 OK al docente titular asignado', async () => {
			alumnoModel.verificarDocenteAsignadoAAlumno.mockResolvedValue(true);
			alumnoModel.getAlumnoById.mockResolvedValue({ id: 4, nombre: 'Lucas', apellido: 'Martínez' });
			alumnoModel.getHistorialAcademicoByAlumnoId.mockResolvedValue(mockHistorialData);

			const docenteTitular = { id: 2, nombre: 'Juan', apellido: 'Perez', rol_id: 1 };
			const result = await obtenerHistorialAcademicoService(4, docenteTitular);

			expect(result.success).toBe(true);
			expect(result.status).toBe(200);
			expect(result.data.alumno.legajo).toBe('ALU-2026-0004');
		});

		test('obtenerHistorialAcademicoService: permite acceso 200 OK a un usuario Administrador', async () => {
			alumnoModel.getAlumnoById.mockResolvedValue({ id: 4, nombre: 'Lucas', apellido: 'Martínez' });
			alumnoModel.getHistorialAcademicoByAlumnoId.mockResolvedValue(mockHistorialData);

			const admin = { id: 1, nombre: 'Admin', rol_id: 2 };
			const result = await obtenerHistorialAcademicoService(4, admin, { periodo: '2025' });

			expect(result.success).toBe(true);
			expect(result.status).toBe(200);
			expect(alumnoModel.getHistorialAcademicoByAlumnoId).toHaveBeenCalledWith(4, { periodo: '2025' });
		});
	});

	describe('Tarea #154: Crear endpoint de historial & #159 Probar consulta', () => {
		test('getMiHistorialAcademicoController: rechaza con 401 si req.usuario no está presente', async () => {
			req.usuario = null;

			await getMiHistorialAcademicoController(req, res);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'No autenticado' }));
		});

		test('getMiHistorialAcademicoController: obtiene exitosamente el historial del alumno del token JWT', async () => {
			req.usuario = { id: 4, nombre: 'Lucas', rol_id: 1 };
			req.query = { periodo: '2025' };

			alumnoModel.getAlumnoById.mockResolvedValue({ id: 4, nombre: 'Lucas', apellido: 'Martínez' });
			alumnoModel.getHistorialAcademicoByAlumnoId.mockResolvedValue(mockHistorialData);

			await getMiHistorialAcademicoController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
				alumno: expect.objectContaining({ id: 4 }),
				resumen_historial: expect.any(Object),
				cursos_anteriores: expect.any(Array)
			}));
		});

		test('getHistorialAcademicoController: retorna 200 con historial por ID de alumno', async () => {
			req.params.id = '4';
			req.usuario = { id: 1, rol_id: 2 }; // Admin

			alumnoModel.getAlumnoById.mockResolvedValue({ id: 4, nombre: 'Lucas', apellido: 'Martínez' });
			alumnoModel.getHistorialAcademicoByAlumnoId.mockResolvedValue(mockHistorialData);

			await getHistorialAcademicoController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
				alumno: expect.objectContaining({ legajo: 'ALU-2026-0004' })
			}));
		});

		test('getHistorialAcademicoController: retorna 403 si el usuario no tiene permisos sobre el alumno', async () => {
			req.params.id = '4';
			req.usuario = { id: 9, rol_id: 1 }; // Docente no asignado

			alumnoModel.verificarDocenteAsignadoAAlumno.mockResolvedValue(false);

			await getHistorialAcademicoController(req, res);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Acceso denegado' }));
		});

		test('getHistorialAcademicoController: maneja errores no controlados y responde con 500', async () => {
			req.params.id = '4';
			req.usuario = { id: 4, rol_id: 1 };

			alumnoModel.getAlumnoById.mockRejectedValue(new Error('Database error'));

			await getHistorialAcademicoController(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Error interno del servidor' }));
		});
	});
});
