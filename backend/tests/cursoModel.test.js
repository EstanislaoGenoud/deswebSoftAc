import { jest } from '@jest/globals';

// Mockeamos la conexión a base de datos
const mockExecute = jest.fn();
jest.unstable_mockModule('../src/config/connection.js', () => ({
	default: {
		execute: mockExecute
	}
}));

const {
	createCurso,
	getCursos,
	getCursosByDocenteId,
	getCursoById,
	getCursoByCodigo,
	updateCurso,
	deleteCurso,
	countCursosByDocente
} = await import('../src/models/cursoModel.js');

describe('Unit Testing: Modelo Cursos (cursoModel.js) - Tarea #84 Probar consulta', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('getCursos', () => {
		test('Debe consultar todos los cursos con paginación por defecto (LIMIT 10, OFFSET 0)', async () => {
			const mockCountResult = [[{ total: 2 }]];
			const mockRows = [
				[
					{
						id: 1,
						codigo: 'DSW-301',
						nombre: 'Desarrollo de Sistemas Web',
						docente_id: 1,
						docente_nombre: 'Admin',
						docente_apellido: 'Sistema'
					},
					{
						id: 2,
						codigo: 'BD-201',
						nombre: 'Bases de Datos Avanzadas',
						docente_id: 1,
						docente_nombre: 'Admin',
						docente_apellido: 'Sistema'
					}
				]
			];

			mockExecute
				.mockResolvedValueOnce(mockCountResult)
				.mockResolvedValueOnce(mockRows);

			const result = await getCursos();

			expect(mockExecute).toHaveBeenCalledTimes(2);
			expect(result.data).toHaveLength(2);
			expect(result.pagination).toEqual({
				total: 2,
				page: 1,
				limit: 10,
				totalPages: 1
			});
		});

		test('Debe aplicar filtro de búsqueda LIKE parametrizado en la consulta', async () => {
			mockExecute
				.mockResolvedValueOnce([[{ total: 1 }]])
				.mockResolvedValueOnce([
					[
						{
							id: 1,
							codigo: 'DSW-301',
							nombre: 'Desarrollo de Sistemas Web',
							docente_id: 1
						}
					]
				]);

			const result = await getCursos({ search: 'Sistemas', page: 1, limit: 5 });

			expect(mockExecute).toHaveBeenCalledTimes(2);
			const countQueryCall = mockExecute.mock.calls[0];
			const dataQueryCall = mockExecute.mock.calls[1];

			expect(countQueryCall[0]).toContain('WHERE (c.nombre LIKE ? OR c.codigo LIKE ?');
			expect(countQueryCall[1]).toContain('%Sistemas%');
			expect(dataQueryCall[0]).toContain('LIMIT 5 OFFSET 0');
			expect(result.data[0].codigo).toBe('DSW-301');
		});

		test('Debe devolver estructura de paginación correcta cuando no hay resultados (Estado Vacío)', async () => {
			mockExecute
				.mockResolvedValueOnce([[{ total: 0 }]])
				.mockResolvedValueOnce([[]]);

			const result = await getCursos({ search: 'CursoInexistenteXYZ' });

			expect(result.data).toEqual([]);
			expect(result.pagination).toEqual({
				total: 0,
				page: 1,
				limit: 10,
				totalPages: 1
			});
		});

		test('Debe filtrar por docente_id correctamente (HU-04 #79)', async () => {
			mockExecute
				.mockResolvedValueOnce([[{ total: 3 }]])
				.mockResolvedValueOnce([
					[
						{ id: 1, codigo: 'DSW-301', docente_id: 5 },
						{ id: 2, codigo: 'BD-201', docente_id: 5 },
						{ id: 3, codigo: 'ING-202', docente_id: 5 }
					]
				]);

			const result = await getCursos({ docente_id: 5, page: 2, limit: 2 });

			expect(mockExecute).toHaveBeenCalledTimes(2);
			const countQueryCall = mockExecute.mock.calls[0];
			expect(countQueryCall[0]).toContain('c.docente_id = ?');
			expect(countQueryCall[1]).toContain(5);

			const dataQueryCall = mockExecute.mock.calls[1];
			expect(dataQueryCall[0]).toContain('LIMIT 2 OFFSET 2');
			expect(result.pagination.totalPages).toBe(2);
		});
	});

	describe('getCursosByDocenteId', () => {
		test('Debe delegar la consulta a getCursos con el docente_id indicado', async () => {
			mockExecute
				.mockResolvedValueOnce([[{ total: 1 }]])
				.mockResolvedValueOnce([
					[
						{ id: 4, codigo: 'AYED-101', nombre: 'Algoritmos', docente_id: 2 }
					]
				]);

			const result = await getCursosByDocenteId(2);

			expect(result.data).toHaveLength(1);
			expect(result.data[0].docente_id).toBe(2);
		});
	});

	describe('getCursoById y getCursoByCodigo', () => {
		test('Debe retornar el curso con datos del docente cuando el ID existe', async () => {
			const mockCourse = {
				id: 1,
				codigo: 'DSW-301',
				nombre: 'Desarrollo de Sistemas Web',
				docente_id: 1,
				docente_nombre: 'Admin'
			};
			mockExecute.mockResolvedValueOnce([[mockCourse]]);

			const result = await getCursoById(1);

			expect(mockExecute).toHaveBeenCalledWith(
				expect.stringContaining('WHERE c.id = ?'),
				[1]
			);
			expect(result).toEqual(mockCourse);
		});

		test('Debe retornar null cuando el ID no existe', async () => {
			mockExecute.mockResolvedValueOnce([[]]);

			const result = await getCursoById(999);

			expect(result).toBeNull();
		});

		test('Debe buscar por código único de curso', async () => {
			const mockCourse = { id: 2, codigo: 'BD-201', nombre: 'Bases de Datos' };
			mockExecute.mockResolvedValueOnce([[mockCourse]]);

			const result = await getCursoByCodigo('BD-201');

			expect(mockExecute).toHaveBeenCalledWith(
				expect.stringContaining('WHERE codigo = ?'),
				['BD-201']
			);
			expect(result).toEqual(mockCourse);
		});
	});

	describe('createCurso, updateCurso y deleteCurso', () => {
		test('Debe insertar un nuevo curso y retornar el insertId', async () => {
			mockExecute.mockResolvedValueOnce([{ insertId: 10 }]);

			const newId = await createCurso({
				codigo: 'TEST-101',
				nombre: 'Curso de Prueba',
				descripcion: 'Descripción de prueba',
				docente_id: 1,
				comision: 'Comisión A',
				periodo: '2026 - 1C',
				aula: 'Lab 1',
				horario: 'Lunes 18:00',
				cupo_maximo: 30,
				activo: 1
			});

			expect(newId).toBe(10);
			expect(mockExecute).toHaveBeenCalledWith(
				expect.stringContaining('INSERT INTO cursos'),
				expect.arrayContaining(['TEST-101', 'Curso de Prueba', 1])
			);
		});

		test('Debe actualizar un curso existente y retornar affectedRows', async () => {
			mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }]);

			const affected = await updateCurso(1, {
				codigo: 'DSW-301-UPDATED',
				nombre: 'Desarrollo Web Actualizado',
				descripcion: 'Nueva desc',
				comision: 'Comisión B',
				periodo: '2026 - 2C',
				aula: 'Lab 2',
				horario: 'Martes 18:00',
				cupo_maximo: 40,
				activo: 1
			});

			expect(affected).toBe(1);
			expect(mockExecute).toHaveBeenCalledWith(
				expect.stringContaining('UPDATE cursos'),
				expect.arrayContaining(['DSW-301-UPDATED', 'Desarrollo Web Actualizado'])
			);

		});

		test('Debe eliminar un curso y retornar affectedRows', async () => {
			mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }]);

			const affected = await deleteCurso(5);

			expect(affected).toBe(1);
			expect(mockExecute).toHaveBeenCalledWith(
				expect.stringContaining('DELETE FROM cursos WHERE id = ?'),
				[5]
			);
		});
	});

	describe('countCursosByDocente', () => {
		test('Debe retornar la cantidad de cursos asignados a un docente', async () => {
			mockExecute.mockResolvedValueOnce([[{ count: 3 }]]);

			const count = await countCursosByDocente(1);

			expect(count).toBe(3);
			expect(mockExecute).toHaveBeenCalledWith(
				expect.stringContaining('SELECT COUNT(*) as count FROM cursos WHERE docente_id = ?'),
				[1]
			);
		});
	});
});
