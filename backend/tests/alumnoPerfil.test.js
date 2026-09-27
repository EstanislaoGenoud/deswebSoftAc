import { jest } from '@jest/globals';

// Mockeamos el modelo de alumno
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
	obtenerPerfilAlumnoService,
	obtenerCalificacionesAlumnoService,
	obtenerEvaluacionesAlumnoService,
	obtenerResumenAcademicoService
} = await import('../src/services/alumnoService.js');

const {
	getMiPerfilAlumnoController,
	getPerfilAlumnoController,
	getCalificacionesAlumnoController,
	getEvaluacionesAlumnoController,
	getResumenAcademicoController
} = await import('../src/controllers/alumnoController.js');

const alumnoModel = await import('../src/models/alumnoModel.js');

describe('HU-09: Consultar perfil del alumno (#139)', () => {
	let req, res;

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

	describe('Tarea #140: Crear endpoint de perfil', () => {
		test('obtenerPerfilAlumnoService: rechaza con 404 si el alumno no existe', async () => {
			alumnoModel.getPerfilCompletoAlumnoById.mockResolvedValue(null);

			const result = await obtenerPerfilAlumnoService(999, { id: 999, rol_id: 1 });

			expect(result.success).toBe(false);
			expect(result.status).toBe(404);
			expect(result.message).toContain('No se encontró ningún alumno');
		});

		test('obtenerPerfilAlumnoService: retorna la ficha de perfil completa con legajo, cursos y resumen', async () => {
			alumnoModel.getPerfilCompletoAlumnoById.mockResolvedValue({
				id: 4,
				legajo: 'ALU-2026-0004',
				carrera: 'Tecnicatura Superior en Desarrollo de Software',
				nombre: 'Lucas',
				apellido: 'Martínez',
				email: 'lucas.martinez@instituto.edu.ar',
				activo: true,
				resumen_academico: { promedio_general: 8.75, total_materias: 3 },
				cursos_inscriptos: [{ curso_id: 1, curso_nombre: 'Desarrollo de Sistemas Web' }]
			});

			const result = await obtenerPerfilAlumnoService(4, { id: 4, rol_id: 1 });

			expect(result.success).toBe(true);
			expect(result.status).toBe(200);
			expect(result.data.legajo).toBe('ALU-2026-0004');
			expect(result.data.resumen_academico.promedio_general).toBe(8.75);
			expect(result.data.cursos_inscriptos).toHaveLength(1);
		});

		test('getMiPerfilAlumnoController: responde 401 si no hay usuario en el token', async () => {
			req.usuario = null;

			await getMiPerfilAlumnoController(req, res);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
				error: 'No autenticado'
			}));
		});

		test('getMiPerfilAlumnoController: responde 200 con el perfil del usuario autenticado', async () => {
			req.usuario = { id: 4, rol_id: 1 };
			alumnoModel.getPerfilCompletoAlumnoById.mockResolvedValue({
				id: 4,
				nombre: 'Lucas',
				apellido: 'Martínez',
				legajo: 'ALU-2026-0004'
			});

			await getMiPerfilAlumnoController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
				id: 4,
				legajo: 'ALU-2026-0004'
			}));
		});

		test('getPerfilAlumnoController: responde 200 con el perfil por ID', async () => {
			req.params.id = '4';
			req.usuario = { id: 4, rol_id: 1 };
			alumnoModel.getPerfilCompletoAlumnoById.mockResolvedValue({
				id: 4,
				nombre: 'Lucas',
				legajo: 'ALU-2026-0004'
			});

			await getPerfilAlumnoController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
				id: 4
			}));
		});
	});

	describe('Tarea #145: Obtener calificaciones', () => {
		test('obtenerCalificacionesAlumnoService: rechaza con 404 si el alumno no existe', async () => {
			alumnoModel.getAlumnoById.mockResolvedValue(null);

			const result = await obtenerCalificacionesAlumnoService(999, { id: 999, rol_id: 1 });

			expect(result.success).toBe(false);
			expect(result.status).toBe(404);
		});

		test('obtenerCalificacionesAlumnoService: retorna el listado de calificaciones y promedio', async () => {
			alumnoModel.getAlumnoById.mockResolvedValue({ id: 4, nombre: 'Lucas', apellido: 'Martínez' });
			alumnoModel.getCalificacionesByAlumnoId.mockResolvedValue([
				{ calificacion_id: 1, evaluacion_nombre: 'Parcial 1', nota: 8.50, estado_calificacion: 'Aprobado' },
				{ calificacion_id: 2, evaluacion_nombre: 'TP 1', nota: 9.00, estado_calificacion: 'Aprobado' }
			]);
			alumnoModel.getResumenAcademicoByAlumnoId.mockResolvedValue({ promedio_general: 8.75 });

			const result = await obtenerCalificacionesAlumnoService(4, { id: 4, rol_id: 1 });

			expect(result.success).toBe(true);
			expect(result.status).toBe(200);
			expect(result.data.total_calificaciones).toBe(2);
			expect(result.data.promedio_general).toBe(8.75);
			expect(result.data.calificaciones[0].nota).toBe(8.50);
		});

		test('getCalificacionesAlumnoController: responde 200 con calificaciones', async () => {
			req.params.id = '4';
			req.usuario = { id: 4, rol_id: 1 };
			alumnoModel.getAlumnoById.mockResolvedValue({ id: 4, nombre: 'Lucas', apellido: 'Martínez' });
			alumnoModel.getCalificacionesByAlumnoId.mockResolvedValue([{ id: 1, nota: 8 }]);
			alumnoModel.getResumenAcademicoByAlumnoId.mockResolvedValue({ promedio_general: 8 });

			await getCalificacionesAlumnoController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
		});
	});

	describe('Tarea #146: Obtener evaluaciones', () => {
		test('obtenerEvaluacionesAlumnoService: rechaza con 404 si el alumno no existe', async () => {
			alumnoModel.getAlumnoById.mockResolvedValue(null);

			const result = await obtenerEvaluacionesAlumnoService(999, { id: 999, rol_id: 1 });

			expect(result.success).toBe(false);
			expect(result.status).toBe(404);
		});

		test('obtenerEvaluacionesAlumnoService: retorna evaluaciones programadas y rendidas', async () => {
			alumnoModel.getAlumnoById.mockResolvedValue({ id: 4, nombre: 'Lucas', apellido: 'Martínez' });
			alumnoModel.getEvaluacionesByAlumnoId.mockResolvedValue([
				{ evaluacion_id: 1, nombre: 'Parcial 1', tipo: 'parcial', fecha_evaluacion: '2026-05-10', nota: 8.5, estado_evaluacion: 'Aprobada' },
				{ evaluacion_id: 2, nombre: 'Parcial 2', tipo: 'parcial', fecha_evaluacion: '2026-06-25', nota: null, estado_evaluacion: 'Pendiente' }
			]);

			const result = await obtenerEvaluacionesAlumnoService(4, { id: 4, rol_id: 1 });

			expect(result.success).toBe(true);
			expect(result.status).toBe(200);
			expect(result.data.total_evaluaciones).toBe(2);
			expect(result.data.evaluaciones[0].estado_evaluacion).toBe('Aprobada');
			expect(result.data.evaluaciones[1].estado_evaluacion).toBe('Pendiente');
		});

		test('getEvaluacionesAlumnoController: responde 200 con evaluaciones', async () => {
			req.params.id = '4';
			req.usuario = { id: 4, rol_id: 1 };
			alumnoModel.getAlumnoById.mockResolvedValue({ id: 4, nombre: 'Lucas', apellido: 'Martínez' });
			alumnoModel.getEvaluacionesByAlumnoId.mockResolvedValue([]);

			await getEvaluacionesAlumnoController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
		});
	});

	describe('Tarea #149: Diseñar resumen académico', () => {
		test('obtenerResumenAcademicoService: calcula y clasifica desempeño correctamente', async () => {
			alumnoModel.getAlumnoById.mockResolvedValue({ id: 4, nombre: 'Lucas', apellido: 'Martínez', email: 'lucas@test.com' });
			alumnoModel.getResumenAcademicoByAlumnoId.mockResolvedValue({
				alumno_id: 4,
				promedio_general: 8.75,
				total_materias: 3,
				evaluaciones_rendidas: 4,
				evaluaciones_aprobadas: 4,
				evaluaciones_pendientes: 1,
				tasa_aprobacion: 100,
				desempeno: 'Excelente',
				estado_matricula: 'Activo'
			});

			const result = await obtenerResumenAcademicoService(4, { id: 4, rol_id: 1 });

			expect(result.success).toBe(true);
			expect(result.status).toBe(200);
			expect(result.data.promedio_general).toBe(8.75);
			expect(result.data.desempeno).toBe('Excelente');
			expect(result.data.tasa_aprobacion).toBe(100);
		});

		test('getResumenAcademicoController: responde 200 con el resumen académico', async () => {
			req.params.id = '4';
			req.usuario = { id: 4, rol_id: 1 };
			alumnoModel.getAlumnoById.mockResolvedValue({ id: 4, nombre: 'Lucas', apellido: 'Martínez' });
			alumnoModel.getResumenAcademicoByAlumnoId.mockResolvedValue({ promedio_general: 7.5, desempeno: 'Muy Bueno' });

			await getResumenAcademicoController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
				promedio_general: 7.5,
				desempeno: 'Muy Bueno'
			}));
		});
	});

	describe('Tarea #150: Probar acceso y control de permisos', () => {
		test('validarAccesoAlumno: rechaza con 401 si no hay usuario autenticado', async () => {
			const resAcceso = await validarAccesoAlumno(4, null);

			expect(resAcceso.permitido).toBe(false);
			expect(resAcceso.status).toBe(401);
		});

		test('validarAccesoAlumno: rechaza con 400 si alumnoId no es un número entero válido', async () => {
			const resAcceso = await validarAccesoAlumno('invalido', { id: 1, rol_id: 2 });

			expect(resAcceso.permitido).toBe(false);
			expect(resAcceso.status).toBe(400);
		});

		test('validarAccesoAlumno: permite acceso al propio alumno cuando el ID coincide', async () => {
			const resAcceso = await validarAccesoAlumno(4, { id: 4, rol_id: 1 });

			expect(resAcceso.permitido).toBe(true);
		});

		test('validarAccesoAlumno: permite acceso al administrador para cualquier alumno', async () => {
			const resAcceso = await validarAccesoAlumno(4, { id: 1, rol_id: 2 }); // Admin con ID 1

			expect(resAcceso.permitido).toBe(true);
		});

		test('validarAccesoAlumno: permite acceso al docente titular del alumno', async () => {
			alumnoModel.verificarDocenteAsignadoAAlumno.mockResolvedValue(true);

			const resAcceso = await validarAccesoAlumno(4, { id: 2, rol_id: 1 }); // Docente con ID 2

			expect(resAcceso.permitido).toBe(true);
			expect(alumnoModel.verificarDocenteAsignadoAAlumno).toHaveBeenCalledWith(2, 4);
		});

		test('validarAccesoAlumno: rechaza con 403 si el docente no es titular del alumno en ningún curso', async () => {
			alumnoModel.verificarDocenteAsignadoAAlumno.mockResolvedValue(false);

			const resAcceso = await validarAccesoAlumno(4, { id: 99, rol_id: 1 }); // Docente ajeno con ID 99

			expect(resAcceso.permitido).toBe(false);
			expect(resAcceso.status).toBe(403);
			expect(resAcceso.message).toContain('No tiene permisos');
		});

		test('validarAccesoAlumno: rechaza con 403 si un estudiante intenta ver el perfil de otro estudiante', async () => {
			alumnoModel.verificarDocenteAsignadoAAlumno.mockResolvedValue(false);

			const resAcceso = await validarAccesoAlumno(5, { id: 4, rol_id: 1 }); // Alumno 4 intenta ver alumno 5

			expect(resAcceso.permitido).toBe(false);
			expect(resAcceso.status).toBe(403);
		});
	});
});
