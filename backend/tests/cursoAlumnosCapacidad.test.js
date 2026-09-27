import { jest } from '@jest/globals';

// Mockeamos la capa de modelos
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

jest.unstable_mockModule('../src/models/inscripcionModel.js', () => ({
	createInscripcion: jest.fn(),
	deleteInscripcion: jest.fn(),
	getInscripcionByCursoYAlumno: jest.fn(),
	countInscripcionesByCursoId: jest.fn(),
	getAlumnosInscriptosByCursoId: jest.fn()
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
	obtenerCapacidadYAlumnosCursoService,
	inscribirAlumnoCursoService,
	desinscribirAlumnoCursoService
} = await import('../src/services/cursoService.js');

const {
	getCapacidadCursoController,
	inscribirAlumnoCursoController,
	desinscribirAlumnoCursoController
} = await import('../src/controllers/cursoController.js');

const {
	validateInscripcionAlumno
} = await import('../src/middlewares/validate.middleware.js');

const cursoModel = await import('../src/models/cursoModel.js');
const usuarioModel = await import('../src/models/usuarioModel.js');

describe('HU-45: Registrar cantidad de alumnos del curso (#112)', () => {
	let req, res, next;

	beforeEach(() => {
		jest.clearAllMocks();

		req = {
			params: {},
			body: {},
			query: {},
			usuario: { id: 10, nombre: 'Docente', rol_id: 1 }
		};

		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis()
		};

		next = jest.fn();
	});

	describe('Tarea #113: Crear consulta de cantidad de alumnos', () => {
		test('Debe retornar 404 si el curso a consultar no existe', async () => {
			cursoModel.getCursoById.mockResolvedValue(null);

			const result = await obtenerCapacidadYAlumnosCursoService(999);

			expect(result.success).toBe(false);
			expect(result.status).toBe(404);
			expect(result.message).toContain('No se encontró ningún curso');
		});

		test('Debe retornar estadísticas completas de capacidad y cantidad de alumnos', async () => {
			cursoModel.getCursoById.mockResolvedValue({ id: 1, nombre: 'Programación Web', cupo_maximo: 30 });
			cursoModel.getEstadisticasCapacidadCurso.mockResolvedValue({
				curso_id: 1,
				codigo: 'PW-2026',
				nombre: 'Programación Web',
				cupo_maximo: 30,
				total_alumnos: 12,
				cupos_disponibles: 18,
				porcentaje_ocupacion: 40,
				estado_cupo: 'disponible'
			});

			const result = await obtenerCapacidadYAlumnosCursoService(1);

			expect(result.success).toBe(true);
			expect(result.status).toBe(200);
			expect(result.data.total_alumnos).toBe(12);
			expect(result.data.cupos_disponibles).toBe(18);
			expect(result.data.porcentaje_ocupacion).toBe(40);
			expect(result.data.estado_cupo).toBe('disponible');
		});

		test('Controlador getCapacidadCursoController responde 200 con las estadísticas', async () => {
			req.params.id = '1';
			cursoModel.getCursoById.mockResolvedValue({ id: 1, nombre: 'Programación Web' });
			cursoModel.getEstadisticasCapacidadCurso.mockResolvedValue({
				curso_id: 1,
				total_alumnos: 5,
				cupo_maximo: 20,
				cupos_disponibles: 15
			});

			await getCapacidadCursoController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
				curso_id: 1,
				total_alumnos: 5
			}));
		});
	});

	describe('Tarea #114: Mostrar cantidad en curso', () => {
		test('Debe reflejar estado sin_inscriptos y 0% de ocupación cuando total_alumnos es 0', async () => {
			cursoModel.getCursoById.mockResolvedValue({ id: 2, cupo_maximo: 25 });
			cursoModel.getEstadisticasCapacidadCurso.mockResolvedValue({
				curso_id: 2,
				cupo_maximo: 25,
				total_alumnos: 0,
				cupos_disponibles: 25,
				porcentaje_ocupacion: 0,
				estado_cupo: 'sin_inscriptos'
			});

			const result = await obtenerCapacidadYAlumnosCursoService(2);

			expect(result.data.total_alumnos).toBe(0);
			expect(result.data.cupos_disponibles).toBe(25);
			expect(result.data.estado_cupo).toBe('sin_inscriptos');
		});

		test('Debe reflejar estado completo y 100% de ocupación cuando no hay cupos disponibles', async () => {
			cursoModel.getCursoById.mockResolvedValue({ id: 3, cupo_maximo: 20 });
			cursoModel.getEstadisticasCapacidadCurso.mockResolvedValue({
				curso_id: 3,
				cupo_maximo: 20,
				total_alumnos: 20,
				cupos_disponibles: 0,
				porcentaje_ocupacion: 100,
				estado_cupo: 'completo'
			});

			const result = await obtenerCapacidadYAlumnosCursoService(3);

			expect(result.data.total_alumnos).toBe(20);
			expect(result.data.cupos_disponibles).toBe(0);
			expect(result.data.porcentaje_ocupacion).toBe(100);
			expect(result.data.estado_cupo).toBe('completo');
		});
	});

	describe('Tarea #115: Actualizar cantidad automáticamente al agregar/eliminar alumnos', () => {
		test('Inscripción: rechaza con 401 si no hay usuario autenticado', async () => {
			const result = await inscribirAlumnoCursoService({
				cursoId: 1,
				alumnoId: 5,
				usuarioAutenticado: null
			});

			expect(result.success).toBe(false);
			expect(result.status).toBe(401);
		});

		test('Inscripción: rechaza con 404 si el curso no existe', async () => {
			cursoModel.getCursoById.mockResolvedValue(null);

			const result = await inscribirAlumnoCursoService({
				cursoId: 999,
				alumnoId: 5,
				usuarioAutenticado: { id: 10, rol_id: 1 }
			});

			expect(result.success).toBe(false);
			expect(result.status).toBe(404);
		});

		test('Inscripción: rechaza con 403 si el docente no es titular del curso ni admin', async () => {
			cursoModel.getCursoById.mockResolvedValue({ id: 1, docente_id: 99 });

			const result = await inscribirAlumnoCursoService({
				cursoId: 1,
				alumnoId: 5,
				usuarioAutenticado: { id: 10, rol_id: 1 } // Docente con ID 10 no es titular
			});

			expect(result.success).toBe(false);
			expect(result.status).toBe(403);
			expect(result.message).toContain('No tiene permisos');
		});

		test('Inscripción: rechaza con 400 si alumnoId no es un entero positivo', async () => {
			cursoModel.getCursoById.mockResolvedValue({ id: 1, docente_id: 10 });

			const result = await inscribirAlumnoCursoService({
				cursoId: 1,
				alumnoId: 'invalido',
				usuarioAutenticado: { id: 10, rol_id: 1 }
			});

			expect(result.success).toBe(false);
			expect(result.status).toBe(400);
		});

		test('Inscripción: rechaza con 404 si el alumno no existe en la base de datos', async () => {
			cursoModel.getCursoById.mockResolvedValue({ id: 1, docente_id: 10 });
			usuarioModel.getUsuarioById.mockResolvedValue([]);

			const result = await inscribirAlumnoCursoService({
				cursoId: 1,
				alumnoId: 555,
				usuarioAutenticado: { id: 10, rol_id: 1 }
			});

			expect(result.success).toBe(false);
			expect(result.status).toBe(404);
			expect(result.message).toContain('No se encontró ningún alumno');
		});

		test('Inscripción: rechaza con 409 si el curso alcanzó el cupo máximo', async () => {
			cursoModel.getCursoById.mockResolvedValue({ id: 1, docente_id: 10, cupo_maximo: 30 });
			usuarioModel.getUsuarioById.mockResolvedValue([{ id: 5, nombre: 'Juan', apellido: 'Pérez' }]);
			cursoModel.getEstadisticasCapacidadCurso.mockResolvedValue({
				curso_id: 1,
				cupo_maximo: 30,
				total_alumnos: 30,
				cupos_disponibles: 0
			});

			const result = await inscribirAlumnoCursoService({
				cursoId: 1,
				alumnoId: 5,
				usuarioAutenticado: { id: 10, rol_id: 1 }
			});

			expect(result.success).toBe(false);
			expect(result.status).toBe(409);
			expect(result.message).toContain('Cupo máximo alcanzado');
		});

		test('Inscripción: rechaza con 409 si el alumno ya se encuentra inscripto (evita duplicados)', async () => {
			cursoModel.getCursoById.mockResolvedValue({ id: 1, docente_id: 10 });
			usuarioModel.getUsuarioById.mockResolvedValue([{ id: 5, nombre: 'Juan', apellido: 'Pérez' }]);
			cursoModel.getEstadisticasCapacidadCurso.mockResolvedValue({
				curso_id: 1,
				cupo_maximo: 30,
				total_alumnos: 15,
				cupos_disponibles: 15
			});
			cursoModel.getInscripcionCursoAlumno.mockResolvedValue({ id: 101, curso_id: 1, alumno_id: 5 });

			const result = await inscribirAlumnoCursoService({
				cursoId: 1,
				alumnoId: 5,
				usuarioAutenticado: { id: 10, rol_id: 1 }
			});

			expect(result.success).toBe(false);
			expect(result.status).toBe(409);
			expect(result.message).toContain('ya se encuentra inscripto');
		});

		test('Inscripción exitosa: docente titular inscribe alumno y retorna capacidad actualizada', async () => {
			cursoModel.getCursoById.mockResolvedValue({ id: 1, docente_id: 10 });
			usuarioModel.getUsuarioById.mockResolvedValue([{ id: 5, nombre: 'Ana', apellido: 'Gómez', email: 'ana@test.com' }]);
			cursoModel.getEstadisticasCapacidadCurso
				.mockResolvedValueOnce({
					curso_id: 1,
					cupo_maximo: 30,
					total_alumnos: 10,
					cupos_disponibles: 20
				})
				.mockResolvedValueOnce({
					curso_id: 1,
					cupo_maximo: 30,
					total_alumnos: 11, // Incrementado automáticamente
					cupos_disponibles: 19,
					porcentaje_ocupacion: 37,
					estado_cupo: 'disponible'
				});
			cursoModel.getInscripcionCursoAlumno.mockResolvedValue(null);
			cursoModel.inscribirAlumnoEnCurso.mockResolvedValue(105);

			const result = await inscribirAlumnoCursoService({
				cursoId: 1,
				alumnoId: 5,
				usuarioAutenticado: { id: 10, rol_id: 1 }
			});

			expect(result.success).toBe(true);
			expect(result.status).toBe(201);
			expect(result.data.inscripcion_id).toBe(105);
			expect(result.data.estadisticas.total_alumnos).toBe(11);
			expect(result.data.estadisticas.cupos_disponibles).toBe(19);
			expect(cursoModel.inscribirAlumnoEnCurso).toHaveBeenCalledWith({
				cursoId: 1,
				alumnoId: 5,
				estado: 'inscripto'
			});
		});

		test('Inscripción exitosa: administrador inscribe alumno en curso ajeno', async () => {
			cursoModel.getCursoById.mockResolvedValue({ id: 1, docente_id: 99 }); // Docente ajeno
			usuarioModel.getUsuarioById.mockResolvedValue([{ id: 6, nombre: 'Carlos', apellido: 'López', email: 'carlos@test.com' }]);
			cursoModel.getEstadisticasCapacidadCurso
				.mockResolvedValueOnce({ curso_id: 1, cupo_maximo: 20, total_alumnos: 5, cupos_disponibles: 15 })
				.mockResolvedValueOnce({ curso_id: 1, cupo_maximo: 20, total_alumnos: 6, cupos_disponibles: 14 });
			cursoModel.getInscripcionCursoAlumno.mockResolvedValue(null);
			cursoModel.inscribirAlumnoEnCurso.mockResolvedValue(106);

			const result = await inscribirAlumnoCursoService({
				cursoId: 1,
				alumnoId: 6,
				usuarioAutenticado: { id: 1, rol_id: 2 } // Admin
			});

			expect(result.success).toBe(true);
			expect(result.status).toBe(201);
		});

		test('Desinscripción: rechaza con 404 si el alumno no está inscripto en el curso', async () => {
			cursoModel.getCursoById.mockResolvedValue({ id: 1, docente_id: 10 });
			cursoModel.getInscripcionCursoAlumno.mockResolvedValue(null);

			const result = await desinscribirAlumnoCursoService({
				cursoId: 1,
				alumnoId: 99,
				usuarioAutenticado: { id: 10, rol_id: 1 }
			});

			expect(result.success).toBe(false);
			expect(result.status).toBe(404);
			expect(result.message).toContain('no se encuentra inscripto');
		});

		test('Desinscripción exitosa: docente titular elimina alumno y retorna capacidad actualizada', async () => {
			cursoModel.getCursoById.mockResolvedValue({ id: 1, docente_id: 10 });
			cursoModel.getInscripcionCursoAlumno.mockResolvedValue({ id: 105, curso_id: 1, alumno_id: 5 });
			cursoModel.desinscribirAlumnoDeCurso.mockResolvedValue(1);
			cursoModel.getEstadisticasCapacidadCurso.mockResolvedValue({
				curso_id: 1,
				cupo_maximo: 30,
				total_alumnos: 10, // Decrementado automáticamente
				cupos_disponibles: 20,
				porcentaje_ocupacion: 33,
				estado_cupo: 'disponible'
			});

			const result = await desinscribirAlumnoCursoService({
				cursoId: 1,
				alumnoId: 5,
				usuarioAutenticado: { id: 10, rol_id: 1 }
			});

			expect(result.success).toBe(true);
			expect(result.status).toBe(200);
			expect(result.data.estadisticas.total_alumnos).toBe(10);
			expect(result.data.estadisticas.cupos_disponibles).toBe(20);
			expect(cursoModel.desinscribirAlumnoDeCurso).toHaveBeenCalledWith(1, 5);
		});
	});

	describe('Tarea #117: Probar actualización y controladores/middleware', () => {
		test('validateInscripcionAlumno: rechaza cuando alumno_id no está presente', () => {
			req.body = {};
			validateInscripcionAlumno(req, res, next);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
				field: 'alumno_id'
			}));
			expect(next).not.toHaveBeenCalled();
		});

		test('validateInscripcionAlumno: rechaza cuando alumno_id no es un entero positivo', () => {
			req.body = { alumno_id: -5 };
			validateInscripcionAlumno(req, res, next);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(next).not.toHaveBeenCalled();
		});

		test('validateInscripcionAlumno: llama a next() cuando alumno_id es válido', () => {
			req.body = { alumno_id: 12 };
			validateInscripcionAlumno(req, res, next);

			expect(next).toHaveBeenCalled();
			expect(res.status).not.toHaveBeenCalled();
		});

		test('inscribirAlumnoCursoController: responde 201 en caso exitoso', async () => {
			req.params.id = '1';
			req.body = { alumno_id: 5 };
			cursoModel.getCursoById.mockResolvedValue({ id: 1, docente_id: 10 });
			usuarioModel.getUsuarioById.mockResolvedValue([{ id: 5, nombre: 'Ana', apellido: 'Gómez' }]);
			cursoModel.getEstadisticasCapacidadCurso
				.mockResolvedValueOnce({ cupos_disponibles: 10 })
				.mockResolvedValueOnce({ total_alumnos: 1, cupos_disponibles: 9 });
			cursoModel.getInscripcionCursoAlumno.mockResolvedValue(null);
			cursoModel.inscribirAlumnoEnCurso.mockResolvedValue(100);

			await inscribirAlumnoCursoController(req, res);

			expect(res.status).toHaveBeenCalledWith(201);
		});

		test('desinscribirAlumnoCursoController: responde 200 en caso exitoso', async () => {
			req.params.id = '1';
			req.params.alumnoId = '5';
			cursoModel.getCursoById.mockResolvedValue({ id: 1, docente_id: 10 });
			cursoModel.getInscripcionCursoAlumno.mockResolvedValue({ id: 100 });
			cursoModel.desinscribirAlumnoDeCurso.mockResolvedValue(1);
			cursoModel.getEstadisticasCapacidadCurso.mockResolvedValue({ total_alumnos: 0, cupos_disponibles: 10 });

			await desinscribirAlumnoCursoController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
		});
	});
});
