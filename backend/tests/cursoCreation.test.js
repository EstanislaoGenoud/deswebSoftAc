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

jest.unstable_mockModule('../src/models/escuelaModel.js', () => ({
	getAllEscuelas: jest.fn(),
	getEscuelaById: jest.fn().mockResolvedValue({ id: 1, nombre: 'Escuela de Informática' }),
	getEscuelaByCodigo: jest.fn(),
	createEscuela: jest.fn(),
	updateEscuela: jest.fn(),
	countCursosByEscuela: jest.fn()
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
	crearCursoService
} = await import('../src/services/cursoService.js');

const {
	createCursoController
} = await import('../src/controllers/cursoController.js');

const cursoModel = await import('../src/models/cursoModel.js');
const usuarioModel = await import('../src/models/usuarioModel.js');

describe('Unit & Integration Testing: HU-05 Crear un Curso (#85, #87, #88, #89, #90, #92, #93, #95)', () => {
	let req;
	let res;

	beforeEach(() => {
		jest.clearAllMocks();
		req = {
			usuario: { id: 2, email: 'juan.perez@instituto.edu.ar', rol_id: 1 },
			body: {},
			params: {},
			query: {}
		};
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis()
		};
	});

	describe('Servicio de Creación de Curso (crearCursoService) - #90', () => {
		test('Debe crear un curso exitosamente y asociarlo al docente autenticado (#92)', async () => {
			const cursoData = {
				codigo: 'DSW-302',
				nombre: 'Desarrollo de Sistemas Web II',
				descripcion: 'Materia avanzada de desarrollo web con microservicios.',
				comision: 'Comisión B',
				periodo: '2026 - 2° Cuatrimestre',
				aula: 'Lab 3',
				horario: 'Martes 18:00 - 22:00',
				cupo_maximo: 30
			};
			const usuarioAutenticado = { id: 2, email: 'juan.perez@instituto.edu.ar', rol_id: 1 };

			cursoModel.getCursoByCodigo.mockResolvedValue(null);
			cursoModel.createCurso.mockResolvedValue(10);
			cursoModel.getCursoById.mockResolvedValue({
				id: 10,
				codigo: 'DSW-302',
				nombre: 'Desarrollo de Sistemas Web II',
				docente_id: 2,
				docente_nombre: 'Juan',
				docente_apellido: 'Perez'
			});

			const result = await crearCursoService({ cursoData, usuarioAutenticado });

			expect(result.success).toBe(true);
			expect(result.status).toBe(201);
			expect(result.id).toBe(10);
			expect(cursoModel.createCurso).toHaveBeenCalledWith(
				expect.objectContaining({
					codigo: 'DSW-302',
					nombre: 'Desarrollo de Sistemas Web II',
					docente_id: 2
				})
			);
		});

		test('Debe retornar 401 si no hay usuario autenticado', async () => {
			const result = await crearCursoService({
				cursoData: { codigo: 'TEST-101', nombre: 'Curso Test' },
				usuarioAutenticado: null
			});

			expect(result.success).toBe(false);
			expect(result.status).toBe(401);
			expect(result.error).toBe('No autenticado');
			expect(cursoModel.createCurso).not.toHaveBeenCalled();
		});

		test('Debe rechazar con 409 Conflict si el código ya existe (#88, #90)', async () => {
			cursoModel.getCursoByCodigo.mockResolvedValue({ id: 1, codigo: 'DSW-301' });

			const result = await crearCursoService({
				cursoData: { codigo: 'DSW-301', nombre: 'Desarrollo Web' },
				usuarioAutenticado: { id: 1, rol_id: 2 }
			});

			expect(result.success).toBe(false);
			expect(result.status).toBe(409);
			expect(result.error).toBe('Conflicto');
			expect(result.message).toContain("Ya existe un curso registrado con el código 'DSW-301'");
			expect(cursoModel.createCurso).not.toHaveBeenCalled();
		});

		test('Debe permitir a un administrador asignar un curso a otro docente válido (#92)', async () => {
			const usuarioAutenticado = { id: 1, email: 'admin@instituto.edu.ar', rol_id: 2 }; // Admin
			const cursoData = {
				codigo: 'RED-101',
				nombre: 'Redes de Computadoras',
				docente_id: 3 // Asignación a docente ID 3
			};

			usuarioModel.getUsuarioById.mockResolvedValue([{ id: 3, nombre: 'María' }]);
			cursoModel.getCursoByCodigo.mockResolvedValue(null);
			cursoModel.createCurso.mockResolvedValue(12);
			cursoModel.getCursoById.mockResolvedValue({
				id: 12,
				codigo: 'RED-101',
				nombre: 'Redes de Computadoras',
				docente_id: 3
			});

			const result = await crearCursoService({ cursoData, usuarioAutenticado });

			expect(result.success).toBe(true);
			expect(result.status).toBe(201);
			expect(cursoModel.createCurso).toHaveBeenCalledWith(
				expect.objectContaining({
					docente_id: 3
				})
			);
		});

		test('Debe responder 404 si el administrador asigna a un docente que no existe (#92)', async () => {
			const usuarioAutenticado = { id: 1, rol_id: 2 };
			const cursoData = {
				codigo: 'RED-101',
				nombre: 'Redes de Computadoras',
				docente_id: 999 // Docente inexistente
			};

			usuarioModel.getUsuarioById.mockResolvedValue([]); // No existe

			const result = await crearCursoService({ cursoData, usuarioAutenticado });

			expect(result.success).toBe(false);
			expect(result.status).toBe(404);
			expect(result.error).toBe('No encontrado');
			expect(cursoModel.createCurso).not.toHaveBeenCalled();
		});
	});

	describe('Controlador de Creación de Curso (createCursoController) - #89, #95', () => {
		test('Debe responder status 201 Created al registrar un curso válido', async () => {
			req.usuario = { id: 1, email: 'admin@instituto.edu.ar', rol_id: 2 };
			req.body = {
				codigo: 'BD-202',
				nombre: 'Bases de Datos NoSQL',
				descripcion: 'MongoDB, Redis y arquitecturas distribuidas.',
				comision: 'Comisión A',
				periodo: '2026 - 1° Cuatrimestre',
				aula: 'Lab 2',
				horario: 'Jueves 18:30 - 21:30',
				cupo_maximo: 35
			};

			cursoModel.getCursoByCodigo.mockResolvedValue(null);
			cursoModel.createCurso.mockResolvedValue(20);
			cursoModel.getCursoById.mockResolvedValue({
				id: 20,
				codigo: 'BD-202',
				nombre: 'Bases de Datos NoSQL',
				docente_id: 1,
				docente_nombre: 'Admin'
			});

			await createCursoController(req, res);

			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 20,
					message: 'Curso creado exitosamente',
					curso: expect.objectContaining({
						id: 20,
						codigo: 'BD-202'
					})
				})
			);
		});

		test('Debe responder con el código de error correspondiente si el servicio falla (e.g. 409 Conflict)', async () => {
			req.usuario = { id: 1, rol_id: 2 };
			req.body = {
				codigo: 'DSW-301',
				nombre: 'Curso Repetido'
			};

			cursoModel.getCursoByCodigo.mockResolvedValue({ id: 1, codigo: 'DSW-301' });

			await createCursoController(req, res);

			expect(res.status).toHaveBeenCalledWith(409);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: 'Conflicto'
				})
			);
		});
	});
});
