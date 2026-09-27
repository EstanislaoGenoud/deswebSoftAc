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
	obtenerCursoDetalleService,
	obtenerEscuelaDeCursoService,
	obtenerAlumnosCursoService
} = await import('../src/services/cursoService.js');

const {
	getCursoDetalleController,
	getEscuelaCursoController,
	getAlumnosCursoController
} = await import('../src/controllers/cursoController.js');

const cursoModel = await import('../src/models/cursoModel.js');

describe('Test Suite: HU-06 Consultar Información del Curso (#96)', () => {
	let req;
	let res;

	beforeEach(() => {
		jest.clearAllMocks();
		req = {
			usuario: null,
			params: {},
			body: {},
			query: {}
		};
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis()
		};
	});

	describe('Tarea #97: Crear Endpoint de Detalle', () => {
		test('Debe retornar 200 OK con toda la información detallada del curso', async () => {
			const mockCursoDetalle = {
				id: 1,
				codigo: 'DSW-301',
				nombre: 'Desarrollo de Sistemas Web',
				descripcion: 'Materia troncal de desarrollo web fullstack',
				docente_id: 2,
				docente_nombre: 'Juan',
				docente_apellido: 'Perez',
				docente_email: 'juan.perez@instituto.edu.ar',
				comision: 'Comisión A',
				periodo: '2026 - 1° Cuatrimestre',
				aula: 'Lab 1',
				horario: 'Lunes y Miércoles 18:30 - 21:30',
				cupo_maximo: 35,
				activo: 1,
				cantidad_alumnos: 3,
				cupos_disponibles: 32,
				porcentaje_ocupacion: 9,
				escuela: {
					id: 1,
					nombre: 'Escuela de Informática y Tecnología',
					codigo: 'ESC-INF',
					director: 'Dr. Roberto Gómez',
					email_contacto: 'informatica@instituto.edu.ar',
					ubicacion: 'Campus Central'
				},
				docente: {
					id: 2,
					nombre: 'Juan',
					apellido: 'Perez',
					email: 'juan.perez@instituto.edu.ar'
				}
			};

			cursoModel.getCursoDetalleById.mockResolvedValue(mockCursoDetalle);

			req.params = { id: '1' };
			await getCursoDetalleController(req, res);

			expect(cursoModel.getCursoDetalleById).toHaveBeenCalledWith('1');
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 1,
					codigo: 'DSW-301',
					nombre: 'Desarrollo de Sistemas Web',
					cantidad_alumnos: 3,
					escuela: expect.objectContaining({
						nombre: 'Escuela de Informática y Tecnología'
					}),
					permisos: expect.objectContaining({
						es_titular: false,
						es_admin: false,
						puede_gestionar: false
					})
				})
			);
		});

		test('Debe responder 404 Not Found si el curso solicitado no existe', async () => {
			cursoModel.getCursoDetalleById.mockResolvedValue(null);

			req.params = { id: '999' };
			await getCursoDetalleController(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: 'No encontrado',
					message: expect.stringMatching(/no se encontró ningún curso/i)
				})
			);
		});
	});

	describe('Tarea #99: Obtener Escuela Asociada', () => {
		test('Debe retornar los datos institucionales de la escuela asociada al curso (200 OK)', async () => {
			cursoModel.getCursoById.mockResolvedValue({
				id: 1,
				codigo: 'DSW-301',
				nombre: 'Desarrollo de Sistemas Web',
				escuela_id: 1
			});

			const mockEscuela = {
				id: 1,
				codigo: 'ESC-INF',
				nombre: 'Escuela de Informática y Tecnología',
				director: 'Dr. Roberto Gómez',
				email_contacto: 'informatica@instituto.edu.ar',
				ubicacion: 'Campus Central - Pabellón 2'
			};
			cursoModel.getEscuelaByCursoId.mockResolvedValue(mockEscuela);

			req.params = { id: '1' };
			await getEscuelaCursoController(req, res);

			expect(cursoModel.getCursoById).toHaveBeenCalledWith('1');
			expect(cursoModel.getEscuelaByCursoId).toHaveBeenCalledWith('1');
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				success: true,
				status: 200,
				curso_id: 1,
				escuela: mockEscuela
			});
		});

		test('Debe responder 404 Not Found al consultar escuela de un curso inexistente', async () => {
			cursoModel.getCursoById.mockResolvedValue(null);

			req.params = { id: '999' };
			await getEscuelaCursoController(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: 'No encontrado'
				})
			);
		});
	});

	describe('Tarea #101: Obtener Cantidad de Alumnos & Capacidad', () => {
		test('El detalle del curso debe incluir conteo de alumnos, cupos disponibles y porcentaje de ocupación', async () => {
			const mockCurso = {
				id: 2,
				codigo: 'BD-201',
				nombre: 'Bases de Datos',
				docente_id: 2,
				cupo_maximo: 30,
				cantidad_alumnos: 15,
				cupos_disponibles: 15,
				porcentaje_ocupacion: 50,
				escuela: { nombre: 'Escuela de Informática' },
				docente: { id: 2, nombre: 'Docente', apellido: 'Titular' }
			};

			cursoModel.getCursoDetalleById.mockResolvedValue(mockCurso);

			const result = await obtenerCursoDetalleService('2', { id: 2, rol_id: 1 });

			expect(result.success).toBe(true);
			expect(result.curso.cantidad_alumnos).toBe(15);
			expect(result.curso.cupos_disponibles).toBe(15);
			expect(result.curso.porcentaje_ocupacion).toBe(50);
		});
	});

	describe('Tarea #104: Validar Permisos en Listado de Alumnos y Gestión', () => {
		test('Debe rechazar con 401 Unauthorized si el usuario no está autenticado', async () => {
			req.usuario = null;
			req.params = { id: '1' };

			await getAlumnosCursoController(req, res);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: 'No autenticado'
				})
			);
		});

		test('Debe rechazar con 403 Forbidden si un docente intenta ver alumnos de un curso que NO le pertenece', async () => {
			// Usuario autenticado es Docente ID 5
			req.usuario = { id: 5, email: 'otro.docente@instituto.edu.ar', rol_id: 1 };
			req.params = { id: '1' };

			// El curso pertenece al Docente ID 2
			cursoModel.getCursoById.mockResolvedValue({
				id: 1,
				codigo: 'DSW-301',
				nombre: 'Desarrollo de Sistemas Web',
				docente_id: 2
			});

			await getAlumnosCursoController(req, res);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: 'Acceso denegado',
					message: expect.stringMatching(/no tiene permisos/i)
				})
			);
			expect(cursoModel.getAlumnosByCursoId).not.toHaveBeenCalled();
		});

		test('Debe permitir (200 OK) al docente titular consultar el listado de alumnos de su curso', async () => {
			// Docente titular ID 2
			req.usuario = { id: 2, email: 'juan.perez@instituto.edu.ar', rol_id: 1 };
			req.params = { id: '1' };

			cursoModel.getCursoById.mockResolvedValue({
				id: 1,
				codigo: 'DSW-301',
				nombre: 'Desarrollo de Sistemas Web',
				docente_id: 2,
				cupo_maximo: 35
			});

			const mockAlumnos = [
				{ alumno_id: 10, nombre: 'Carlos', apellido: 'Gómez', email: 'carlos@alumnos.edu.ar', estado: 'regular' },
				{ alumno_id: 11, nombre: 'Ana', apellido: 'Martínez', email: 'ana@alumnos.edu.ar', estado: 'regular' }
			];
			cursoModel.getAlumnosByCursoId.mockResolvedValue(mockAlumnos);

			await getAlumnosCursoController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					success: true,
					curso_id: 1,
					total_alumnos: 2,
					cupo_maximo: 35,
					cupos_disponibles: 33,
					alumnos: mockAlumnos
				})
			);
		});

		test('Debe permitir (200 OK) a un administrador consultar el listado de alumnos de cualquier curso', async () => {
			// Administrador ID 1 (rol_id: 2)
			req.usuario = { id: 1, email: 'admin@instituto.edu.ar', rol_id: 2 };
			req.params = { id: '1' };

			cursoModel.getCursoById.mockResolvedValue({
				id: 1,
				codigo: 'DSW-301',
				nombre: 'Desarrollo de Sistemas Web',
				docente_id: 2,
				cupo_maximo: 35
			});

			const mockAlumnos = [
				{ alumno_id: 10, nombre: 'Carlos', apellido: 'Gómez', email: 'carlos@alumnos.edu.ar', estado: 'regular' }
			];
			cursoModel.getAlumnosByCursoId.mockResolvedValue(mockAlumnos);

			await getAlumnosCursoController(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					success: true,
					total_alumnos: 1,
					alumnos: mockAlumnos
				})
			);
		});

		test('El servicio de detalle debe marcar correctamente los flags de permisos según el usuario autenticado', async () => {
			const mockCurso = {
				id: 1,
				codigo: 'DSW-301',
				docente_id: 2,
				cupo_maximo: 35,
				cantidad_alumnos: 0
			};
			cursoModel.getCursoDetalleById.mockResolvedValue(mockCurso);

			// Docente Titular
			const resTitular = await obtenerCursoDetalleService('1', { id: 2, rol_id: 1 });
			expect(resTitular.curso.permisos.es_titular).toBe(true);
			expect(resTitular.curso.permisos.puede_gestionar).toBe(true);

			// Docente NO Titular
			const resNoTitular = await obtenerCursoDetalleService('1', { id: 4, rol_id: 1 });
			expect(resNoTitular.curso.permisos.es_titular).toBe(false);
			expect(resNoTitular.curso.permisos.puede_gestionar).toBe(false);

			// Administrador
			const resAdmin = await obtenerCursoDetalleService('1', { id: 9, rol_id: 2 });
			expect(resAdmin.curso.permisos.es_admin).toBe(true);
			expect(resAdmin.curso.permisos.puede_gestionar).toBe(true);
		});
	});
});
