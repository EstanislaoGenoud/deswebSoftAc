import pool from '../config/connection.js';

/**
 * Capa de Datos: Modelo para la entidad Alumno (HU-07: Visualizar listado de alumnos #118 & HU-09: Consultar perfil #139)
 * Tareas HU-07:
 * - #119: Crear modelo de alumno
 * - #120: Crear relación alumno-curso
 * - #121: Crear endpoint de alumnos
 * - #122: Implementar listado
 * - #127: Crear acceso al perfil
 * - #129: Probar listado
 */

/**
 * Obtiene el listado y búsqueda de alumnos con paginación, filtros avanzados y ordenamiento
 * (HU-07: Visualizar listado #118 & HU-08: Buscar alumno #130).
 * 
 * Tareas HU-08:
 * - #131: Crear parámetro de búsqueda (search, q, nombre, apellido, legajo, email)
 * - #136: Implementar filtrado (curso_id, docente_id, escuela_id, estado, periodo, promedios, ordenamiento)
 * - #137: Manejar resultados vacíos (estructura con mensaje, paginación segura y filtros aplicados)
 * 
 * @param {object} options
 * @param {string} [options.search]
 * @param {string} [options.q]
 * @param {string} [options.nombre]
 * @param {string} [options.apellido]
 * @param {string} [options.email]
 * @param {string} [options.legajo]
 * @param {number|string} [options.curso_id]
 * @param {number|string} [options.docente_id]
 * @param {number|string} [options.escuela_id]
 * @param {string} [options.estado]
 * @param {string} [options.periodo]
 * @param {string} [options.desempeno]
 * @param {number|string} [options.promedio_min]
 * @param {number|string} [options.promedio_max]
 * @param {string} [options.sortBy]
 * @param {string} [options.sortOrder]
 * @param {number|string} [options.page]
 * @param {number|string} [options.limit]
 * @returns {Promise<{ data: Array, pagination: object, mensaje: string, filtros_aplicados: object }>}
 */
export const getAlumnos = async ({
	search = '',
	q = '',
	nombre = '',
	apellido = '',
	email = '',
	legajo = '',
	curso_id = null,
	docente_id = null,
	escuela_id = null,
	estado = null,
	periodo = null,
	desempeno = null,
	promedio_min = null,
	promedio_max = null,
	sortBy = 'apellido',
	sortOrder = 'ASC',
	page = 1,
	limit = 10
} = {}) => {
	const safePage = Math.max(1, parseInt(page, 10) || 1);
	const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
	const offset = (safePage - 1) * safeLimit;

	let whereClauses = [];
	let queryParams = [];

	// #131: Parámetro general de búsqueda (search o q)
	const searchTerm = (search || q || '').trim();
	if (searchTerm !== '') {
		const searchPattern = `%${searchTerm}%`;
		whereClauses.push('(u.nombre LIKE ? OR u.apellido LIKE ? OR u.email LIKE ? OR CONCAT("ALU-2026-", LPAD(u.id, 4, "0")) LIKE ? OR CAST(u.id AS CHAR) = ?)');
		queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchTerm);
	}

	// #131 & #136: Filtros específicos por campo
	if (nombre && nombre.trim() !== '') {
		whereClauses.push('u.nombre LIKE ?');
		queryParams.push(`%${nombre.trim()}%`);
	}

	if (apellido && apellido.trim() !== '') {
		whereClauses.push('u.apellido LIKE ?');
		queryParams.push(`%${apellido.trim()}%`);
	}

	if (email && email.trim() !== '') {
		whereClauses.push('u.email LIKE ?');
		queryParams.push(`%${email.trim()}%`);
	}

	if (legajo && legajo.trim() !== '') {
		const legajoClean = legajo.trim().replace(/^ALU-2026-/i, '');
		whereClauses.push('(CONCAT("ALU-2026-", LPAD(u.id, 4, "0")) LIKE ? OR CAST(u.id AS CHAR) = ?)');
		queryParams.push(`%${legajo.trim()}%`, legajoClean);
	}

	// #136: Filtros relacionales de cursos, docentes y escuelas
	if (curso_id) {
		whereClauses.push('EXISTS (SELECT 1 FROM inscripciones i_c WHERE i_c.alumno_id = u.id AND i_c.curso_id = ?)');
		queryParams.push(parseInt(curso_id, 10));
	}

	if (docente_id) {
		whereClauses.push('EXISTS (SELECT 1 FROM inscripciones i_d JOIN cursos c_d ON i_d.curso_id = c_d.id WHERE i_d.alumno_id = u.id AND c_d.docente_id = ?)');
		queryParams.push(parseInt(docente_id, 10));
	}

	if (escuela_id) {
		whereClauses.push('EXISTS (SELECT 1 FROM inscripciones i_esc JOIN cursos c_esc ON i_esc.curso_id = c_esc.id WHERE i_esc.alumno_id = u.id AND c_esc.escuela_id = ?)');
		queryParams.push(parseInt(escuela_id, 10));
	}

	if (estado && estado.trim() !== '') {
		whereClauses.push('EXISTS (SELECT 1 FROM inscripciones i_e WHERE i_e.alumno_id = u.id AND i_e.estado = ?)');
		queryParams.push(estado.trim());
	}

	if (periodo && periodo.trim() !== '') {
		whereClauses.push('EXISTS (SELECT 1 FROM inscripciones i_p JOIN cursos c_p ON i_p.curso_id = c_p.id WHERE i_p.alumno_id = u.id AND c_p.periodo LIKE ?)');
		queryParams.push(`%${periodo.trim()}%`);
	}

	const whereString = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';

	// Sanitización de ordenamiento dinámico (#136)
	const allowedSortFields = {
		apellido: 'u.apellido',
		nombre: 'u.nombre',
		legajo: 'u.id',
		fecha_ingreso: 'u.fecha_creacion',
		total_cursos: 'total_cursos',
		promedio_general: 'promedio_general'
	};
	const sortField = allowedSortFields[sortBy] || 'u.apellido';
	const orderDirection = String(sortOrder).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

	const countQuery = `
		SELECT COUNT(DISTINCT u.id) as total
		FROM usuarios u
		${whereString}
	`;

	const dataQuery = `
		SELECT 
			u.id,
			u.nombre,
			u.apellido,
			CONCAT(u.nombre, ' ', u.apellido) AS nombre_completo,
			u.email,
			CONCAT('ALU-2026-', LPAD(u.id, 4, '0')) AS legajo,
			'Tecnicatura Superior en Desarrollo de Software' AS carrera,
			u.activo,
			u.fecha_creacion AS fecha_ingreso,
			COALESCE((SELECT COUNT(*) FROM inscripciones i WHERE i.alumno_id = u.id), 0) AS total_cursos,
			COALESCE((
				SELECT GROUP_CONCAT(c.nombre SEPARATOR ', ')
				FROM inscripciones i
				JOIN cursos c ON i.curso_id = c.id
				WHERE i.alumno_id = u.id
			), 'Sin inscripciones') AS cursos_nombres,
			COALESCE((
				SELECT ROUND(AVG(cal.nota), 2)
				FROM calificaciones cal
				WHERE cal.alumno_id = u.id
			), 0) AS promedio_general
		FROM usuarios u
		${whereString}
		ORDER BY ${sortField} ${orderDirection}, u.id ASC
		LIMIT ${safeLimit} OFFSET ${offset}
	`;

	const [[countResult], [rows]] = await Promise.all([
		pool.execute(countQuery, queryParams),
		pool.execute(dataQuery, queryParams)
	]);

	const total = countResult[0]?.total || 0;
	const totalPages = total > 0 ? Math.ceil(total / safeLimit) : 0;

	let data = rows.map(alumno => {
		const prom = Number(alumno.promedio_general) || 0;
		let nivelDesempeno = 'Sin Calificaciones';
		if (prom > 0) {
			if (prom >= 8.5) nivelDesempeno = 'Excelente';
			else if (prom >= 7.0) nivelDesempeno = 'Muy Bueno';
			else if (prom >= 4.0) nivelDesempeno = 'Regular';
			else nivelDesempeno = 'En Riesgo';
		}

		return {
			...alumno,
			promedio_general: prom,
			total_cursos: Number(alumno.total_cursos) || 0,
			desempeno: nivelDesempeno,
			activo: Boolean(alumno.activo),
			acceso_perfil: {
				perfil_url: `/api/v1/alumnos/${alumno.id}/perfil`,
				calificaciones_url: `/api/v1/alumnos/${alumno.id}/calificaciones`,
				evaluaciones_url: `/api/v1/alumnos/${alumno.id}/evaluaciones`,
				resumen_url: `/api/v1/alumnos/${alumno.id}/resumen-academico`,
				historial_url: `/api/v1/alumnos/${alumno.id}/historial-academico`
			}
		};
	});

	// Filtrado adicional en memoria para métricas derivadas si se solicitan (#136)
	if (promedio_min !== null && !isNaN(Number(promedio_min))) {
		data = data.filter(a => a.promedio_general >= Number(promedio_min));
	}
	if (promedio_max !== null && !isNaN(Number(promedio_max))) {
		data = data.filter(a => a.promedio_general <= Number(promedio_max));
	}
	if (desempeno && desempeno.trim() !== '') {
		data = data.filter(a => a.desempeno.toLowerCase() === desempeno.trim().toLowerCase());
	}

	// Manejo de resultados vacíos (#137)
	const hayResultados = data.length > 0;
	const mensaje = hayResultados
		? `Se encontraron ${data.length} alumnos`
		: 'No se encontraron alumnos que coincidan con los criterios de búsqueda especificados';

	return {
		data,
		pagination: {
			total,
			page: safePage,
			limit: safeLimit,
			totalPages,
			hasNextPage: safePage < totalPages,
			hasPrevPage: safePage > 1
		},
		mensaje,
		filtros_aplicados: {
			search: searchTerm || undefined,
			nombre: nombre || undefined,
			apellido: apellido || undefined,
			email: email || undefined,
			legajo: legajo || undefined,
			curso_id: curso_id || undefined,
			docente_id: docente_id || undefined,
			escuela_id: escuela_id || undefined,
			estado: estado || undefined,
			periodo: periodo || undefined,
			desempeno: desempeno || undefined,
			promedio_min: promedio_min || undefined,
			promedio_max: promedio_max || undefined,
			sortBy,
			sortOrder: orderDirection
		}
	};
};

/**
 * Alias de búsqueda avanzada para alumnos (HU-08 #130, #131, #136).
 */
export const buscarAlumnos = getAlumnos;

/**
 * Obtiene los datos personales de un alumno por su ID.
 * @param {number|string} id 
 * @returns {Promise<object|null>}
 */
export const getAlumnoById = async (id) => {
	const query = `
		SELECT 
			id, 
			nombre, 
			apellido, 
			email, 
			rol_id, 
			activo, 
			fecha_creacion,
			fecha_actualizacion
		FROM usuarios 
		WHERE id = ?
	`;
	const [rows] = await pool.execute(query, [parseInt(id, 10)]);
	return rows.length > 0 ? rows[0] : null;
};

/**
 * Obtiene los cursos en los que está matriculado/inscripto un alumno.
 * @param {number|string} alumnoId 
 * @returns {Promise<Array>}
 */
export const getCursosInscriptosByAlumnoId = async (alumnoId) => {
	const query = `
		SELECT 
			c.id AS curso_id,
			c.codigo AS curso_codigo,
			c.nombre AS curso_nombre,
			c.comision,
			c.periodo,
			c.aula,
			c.horario,
			i.id AS inscripcion_id,
			i.estado AS condicion_materia,
			i.fecha_inscripcion,
			u.id AS docente_id,
			CONCAT(u.nombre, ' ', u.apellido) AS docente_nombre_completo,
			u.email AS docente_email,
			e.id AS escuela_id,
			e.nombre AS escuela_nombre,
			e.codigo AS escuela_codigo
		FROM inscripciones i
		JOIN cursos c ON i.curso_id = c.id
		JOIN usuarios u ON c.docente_id = u.id
		LEFT JOIN escuelas e ON c.escuela_id = e.id
		WHERE i.alumno_id = ?
		ORDER BY c.nombre ASC
	`;
	const [rows] = await pool.execute(query, [parseInt(alumnoId, 10)]);
	return rows;
};

/**
 * Obtiene las calificaciones registradas de un alumno (HU-09 #145).
 * @param {number|string} alumnoId 
 * @returns {Promise<Array>}
 */
export const getCalificacionesByAlumnoId = async (alumnoId) => {
	const query = `
		SELECT 
			cal.id AS calificacion_id,
			cal.nota,
			cal.observaciones,
			cal.fecha_calificacion,
			ev.id AS evaluacion_id,
			ev.nombre AS evaluacion_nombre,
			ev.tipo AS evaluacion_tipo,
			ev.fecha_evaluacion,
			ev.ponderacion,
			ev.criterio_aprobacion,
			c.id AS curso_id,
			c.codigo AS curso_codigo,
			c.nombre AS curso_nombre,
			CASE 
				WHEN cal.nota >= ev.criterio_aprobacion THEN 'Aprobado'
				ELSE 'Desaprobado'
			END AS estado_calificacion
		FROM calificaciones cal
		JOIN evaluaciones ev ON cal.evaluacion_id = ev.id
		JOIN cursos c ON ev.curso_id = c.id
		WHERE cal.alumno_id = ?
		ORDER BY ev.fecha_evaluacion DESC, cal.fecha_calificacion DESC
	`;
	const [rows] = await pool.execute(query, [parseInt(alumnoId, 10)]);
	return rows;
};

/**
 * Obtiene todas las evaluaciones correspondientes a los cursos del alumno (HU-09 #146).
 * Incluye el estado de si fue rendida (con su nota) o si está pendiente.
 * @param {number|string} alumnoId 
 * @returns {Promise<Array>}
 */
export const getEvaluacionesByAlumnoId = async (alumnoId) => {
	const query = `
		SELECT 
			ev.id AS evaluacion_id,
			ev.nombre AS evaluacion_nombre,
			ev.tipo AS evaluacion_tipo,
			ev.fecha_evaluacion,
			ev.ponderacion,
			ev.criterio_aprobacion,
			c.id AS curso_id,
			c.codigo AS curso_codigo,
			c.nombre AS curso_nombre,
			cal.id AS calificacion_id,
			cal.nota,
			cal.observaciones,
			CASE 
				WHEN cal.nota IS NOT NULL AND cal.nota >= ev.criterio_aprobacion THEN 'Aprobada'
				WHEN cal.nota IS NOT NULL AND cal.nota < ev.criterio_aprobacion THEN 'Desaprobada'
				ELSE 'Pendiente'
			END AS estado_evaluacion
		FROM inscripciones i
		JOIN cursos c ON i.curso_id = c.id
		JOIN evaluaciones ev ON c.id = ev.curso_id
		LEFT JOIN calificaciones cal ON ev.id = cal.evaluacion_id AND cal.alumno_id = i.alumno_id
		WHERE i.alumno_id = ?
		ORDER BY ev.fecha_evaluacion ASC
	`;
	const [rows] = await pool.execute(query, [parseInt(alumnoId, 10)]);
	return rows;
};

/**
 * Calcula y genera el resumen académico del alumno (HU-09 #149).
 * Métricas: Promedio general, materias aprobadas, evaluaciones rendidas/pendientes y desempeño.
 * @param {number|string} alumnoId 
 * @returns {Promise<object>}
 */
export const getResumenAcademicoByAlumnoId = async (alumnoId) => {
	const safeAlumnoId = parseInt(alumnoId, 10);
	const cursos = await getCursosInscriptosByAlumnoId(safeAlumnoId);
	const evaluaciones = await getEvaluacionesByAlumnoId(safeAlumnoId);
	const calificaciones = await getCalificacionesByAlumnoId(safeAlumnoId);

	const totalCursos = cursos.length;
	const totalEvaluaciones = evaluaciones.length;

	const evaluacionesRendidas = calificaciones.length;
	const evaluacionesPendientes = Math.max(0, totalEvaluaciones - evaluacionesRendidas);

	const evaluacionesAprobadas = calificaciones.filter(c => Number(c.nota) >= (c.criterio_aprobacion || 4)).length;
	const evaluacionesDesaprobadas = evaluacionesRendidas - evaluacionesAprobadas;

	let sumaNotas = 0;
	calificaciones.forEach(c => {
		sumaNotas += Number(c.nota) || 0;
	});

	const promedioGeneral = evaluacionesRendidas > 0 
		? Math.round((sumaNotas / evaluacionesRendidas) * 100) / 100 
		: 0;

	const tasaAprobacion = evaluacionesRendidas > 0 
		? Math.round((evaluacionesAprobadas / evaluacionesRendidas) * 100) 
		: 0;

	// Determinación de nivel de desempeño académico (#149)
	let desempeno = 'Sin Calificaciones';
	if (evaluacionesRendidas > 0) {
		if (promedioGeneral >= 8.5) {
			desempeno = 'Excelente';
		} else if (promedioGeneral >= 7.0) {
			desempeno = 'Muy Bueno';
		} else if (promedioGeneral >= 4.0) {
			desempeno = 'Regular';
		} else {
			desempeno = 'En Riesgo';
		}
	}

	return {
		alumno_id: safeAlumnoId,
		total_materias: totalCursos,
		promedio_general: promedioGeneral,
		total_evaluaciones: totalEvaluaciones,
		evaluaciones_rendidas: evaluacionesRendidas,
		evaluaciones_pendientes: evaluacionesPendientes,
		evaluaciones_aprobadas: evaluacionesAprobadas,
		evaluaciones_desaprobadas: evaluacionesDesaprobadas,
		tasa_aprobacion: tasaAprobacion,
		desempeno,
		estado_matricula: 'Activo'
	};
};

/**
 * Obtiene la ficha de perfil completa y consolidada del alumno (HU-09 #140, #149).
 * @param {number|string} alumnoId 
 * @returns {Promise<object|null>}
 */
export const getPerfilCompletoAlumnoById = async (alumnoId) => {
	const safeAlumnoId = parseInt(alumnoId, 10);
	const alumno = await getAlumnoById(safeAlumnoId);
	if (!alumno) return null;

	const cursos = await getCursosInscriptosByAlumnoId(safeAlumnoId);
	const resumen = await getResumenAcademicoByAlumnoId(safeAlumnoId);

	// Legajo y carrera formateados
	const legajo = `ALU-2026-${String(safeAlumnoId).padStart(4, '0')}`;
	const carrera = 'Tecnicatura Superior en Desarrollo de Software';

	return {
		id: alumno.id,
		legajo,
		carrera,
		nombre: alumno.nombre,
		apellido: alumno.apellido,
		nombre_completo: `${alumno.nombre} ${alumno.apellido}`,
		email: alumno.email,
		activo: Boolean(alumno.activo),
		fecha_ingreso: alumno.fecha_creacion,
		resumen_academico: resumen,
		cursos_inscriptos: cursos
	};
};

/**
 * Verifica si un docente tiene asignado al alumno en al menos uno de sus cursos (HU-09 #150).
 * @param {number|string} docenteId 
 * @param {number|string} alumnoId 
 * @returns {Promise<boolean>}
 */
export const verificarDocenteAsignadoAAlumno = async (docenteId, alumnoId) => {
	const query = `
		SELECT 1 
		FROM inscripciones i
		JOIN cursos c ON i.curso_id = c.id
		WHERE i.alumno_id = ? AND c.docente_id = ?
		LIMIT 1
	`;
	const [rows] = await pool.execute(query, [parseInt(alumnoId, 10), parseInt(docenteId, 10)]);
	return rows.length > 0;
};

/**
 * Obtiene el historial académico completo de un alumno (HU-10: Consultar historial académico #151, #153, #154).
 * Define y recupera la relación alumno → cursos anteriores y actuales, agrupados cronológicamente
 * con sus evaluaciones, calificaciones obtenidas, condición final y métricas históricas de avance.
 * 
 * @param {number|string} alumnoId 
 * @param {object} [options]
 * @param {string} [options.periodo]
 * @param {string} [options.estado]
 * @param {number|string} [options.curso_id]
 * @returns {Promise<object|null>}
 */
export const getHistorialAcademicoByAlumnoId = async (alumnoId, { periodo, estado, curso_id } = {}) => {
	const safeAlumnoId = parseInt(alumnoId, 10);
	const alumno = await getAlumnoById(safeAlumnoId);
	if (!alumno) return null;

	let whereClauses = ['i.alumno_id = ?'];
	let queryParams = [safeAlumnoId];

	if (periodo && periodo.trim() !== '') {
		whereClauses.push('c.periodo LIKE ?');
		queryParams.push(`%${periodo.trim()}%`);
	}

	if (estado && estado.trim() !== '') {
		whereClauses.push('i.estado = ?');
		queryParams.push(estado.trim());
	}

	if (curso_id) {
		whereClauses.push('c.id = ?');
		queryParams.push(parseInt(curso_id, 10));
	}

	const whereString = ` WHERE ${whereClauses.join(' AND ')}`;

	const queryCursos = `
		SELECT 
			c.id AS curso_id,
			c.codigo AS curso_codigo,
			c.nombre AS curso_nombre,
			c.descripcion AS curso_descripcion,
			c.comision,
			c.periodo,
			c.aula,
			c.horario,
			c.activo AS curso_activo,
			i.id AS inscripcion_id,
			i.estado AS estado_cursada,
			i.fecha_inscripcion,
			u.id AS docente_id,
			CONCAT(u.nombre, ' ', u.apellido) AS docente_nombre_completo,
			u.email AS docente_email,
			e.id AS escuela_id,
			e.nombre AS escuela_nombre,
			e.codigo AS escuela_codigo
		FROM inscripciones i
		JOIN cursos c ON i.curso_id = c.id
		JOIN usuarios u ON c.docente_id = u.id
		LEFT JOIN escuelas e ON c.escuela_id = e.id
		${whereString}
		ORDER BY c.periodo DESC, c.nombre ASC
	`;

	const [cursosRows] = await pool.execute(queryCursos, queryParams);

	// Obtenemos todas las calificaciones del alumno para cruzar con cada materia
	const todasCalificaciones = await getCalificacionesByAlumnoId(safeAlumnoId);
	const todasEvaluaciones = await getEvaluacionesByAlumnoId(safeAlumnoId);

	// Clasificar cursos anteriores vs actuales
	const cursosProcesados = cursosRows.map(curso => {
		const califsCurso = todasCalificaciones.filter(cal => cal.curso_id === curso.curso_id);
		const evalsCurso = todasEvaluaciones.filter(ev => ev.curso_id === curso.curso_id);

		let sumaNotas = 0;
		califsCurso.forEach(cal => {
			sumaNotas += Number(cal.nota) || 0;
		});

		const promedioCurso = califsCurso.length > 0 
			? Math.round((sumaNotas / califsCurso.length) * 100) / 100 
			: null;

		// Determinación de tipo de periodo: "anterior" si el periodo contiene año 2025 o anterior, o si el estado es regular/promocionado
		const anioPeriodo = parseInt((curso.periodo || '').match(/\d{4}/)?.[0] || '2026', 10);
		const esAnterior = anioPeriodo < 2026 || ['promocionado', 'regular', 'libre'].includes(curso.estado_cursada);
		const tipoPeriodo = esAnterior ? 'anterior' : 'actual';

		// Condición final descriptiva
		let condicionFinal = 'En Cursada';
		if (curso.estado_cursada === 'promocionado') {
			condicionFinal = 'Promocionada';
		} else if (curso.estado_cursada === 'regular') {
			condicionFinal = 'Regularizada';
		} else if (curso.estado_cursada === 'libre') {
			condicionFinal = 'Libre';
		} else if (promedioCurso !== null) {
			condicionFinal = promedioCurso >= 4.0 ? 'Aprobada' : 'Desaprobada';
		}

		return {
			curso_id: curso.curso_id,
			codigo: curso.curso_codigo,
			nombre: curso.curso_nombre,
			descripcion: curso.curso_descripcion,
			comision: curso.comision,
			periodo: curso.periodo,
			tipo_periodo: tipoPeriodo,
			estado_cursada: curso.estado_cursada,
			condicion_final: condicionFinal,
			aula: curso.aula,
			horario: curso.horario,
			fecha_inscripcion: curso.fecha_inscripcion,
			docente: {
				id: curso.docente_id,
				nombre_completo: curso.docente_nombre_completo,
				email: curso.docente_email
			},
			escuela: {
				id: curso.escuela_id,
				codigo: curso.escuela_codigo,
				nombre: curso.escuela_nombre
			},
			evaluaciones_total: evalsCurso.length,
			evaluaciones_rendidas: califsCurso.length,
			promedio_curso: promedioCurso,
			calificaciones: califsCurso.map(cal => ({
				evaluacion_id: cal.evaluacion_id,
				evaluacion_nombre: cal.evaluacion_nombre,
				tipo: cal.evaluacion_tipo,
				nota: Number(cal.nota),
				criterio_aprobacion: Number(cal.criterio_aprobacion),
				estado: cal.estado_calificacion,
				ponderacion: cal.ponderacion,
				observaciones: cal.observaciones,
				fecha_calificacion: cal.fecha_calificacion
			}))
		};
	});

	const cursosAnteriores = cursosProcesados.filter(c => c.tipo_periodo === 'anterior');
	const cursosActuales = cursosProcesados.filter(c => c.tipo_periodo === 'actual');

	// Agrupación por Periodo
	const historialPorPeriodo = {};
	cursosProcesados.forEach(curso => {
		const per = curso.periodo || 'Sin Periodo';
		if (!historialPorPeriodo[per]) {
			historialPorPeriodo[per] = [];
		}
		historialPorPeriodo[per].push(curso);
	});

	// Cálculo de Métricas Globales Históricas
	const totalMateriasCursadas = cursosProcesados.length;
	const materiasAprobadas = cursosProcesados.filter(c => ['Promocionada', 'Aprobada'].includes(c.condicion_final) || (c.promedio_curso !== null && c.promedio_curso >= 4)).length;
	const materiasRegulares = cursosProcesados.filter(c => c.condicion_final === 'Regularizada').length;
	const materiasEnCurso = cursosActuales.length;
	const materiasDesaprobadas = cursosProcesados.filter(c => c.condicion_final === 'Desaprobada' || c.condicion_final === 'Libre').length;

	let sumaTodasNotas = 0;
	let conteoNotas = 0;
	cursosProcesados.forEach(c => {
		c.calificaciones.forEach(cal => {
			sumaTodasNotas += cal.nota;
			conteoNotas++;
		});
	});

	const promedioHistoricoGeneral = conteoNotas > 0 
		? Math.round((sumaTodasNotas / conteoNotas) * 100) / 100 
		: 0;

	// Porcentaje estimado de avance sobre un plan estándar de 20 materias
	const planTotalMaterias = 20;
	const porcentajeAvanceCarrera = Math.min(100, Math.round((materiasAprobadas / planTotalMaterias) * 100));

	let desempenoHistorico = 'Sin Calificaciones';
	if (conteoNotas > 0) {
		if (promedioHistoricoGeneral >= 8.5) desempenoHistorico = 'Excelente';
		else if (promedioHistoricoGeneral >= 7.0) desempenoHistorico = 'Muy Bueno';
		else if (promedioHistoricoGeneral >= 4.0) desempenoHistorico = 'Regular';
		else desempenoHistorico = 'En Riesgo';
	}

	const legajo = `ALU-2026-${String(safeAlumnoId).padStart(4, '0')}`;
	const carrera = 'Tecnicatura Superior en Desarrollo de Software';

	return {
		alumno: {
			id: alumno.id,
			legajo,
			carrera,
			nombre: alumno.nombre,
			apellido: alumno.apellido,
			nombre_completo: `${alumno.nombre} ${alumno.apellido}`,
			email: alumno.email,
			activo: Boolean(alumno.activo),
			fecha_ingreso: alumno.fecha_creacion,
			estado_matricula: 'Activo'
		},
		resumen_historial: {
			total_materias_cursadas: totalMateriasCursadas,
			materias_aprobadas: materiasAprobadas,
			materias_regulares: materiasRegulares,
			materias_en_curso: materiasEnCurso,
			materias_desaprobadas: materiasDesaprobadas,
			cursos_anteriores_count: cursosAnteriores.length,
			cursos_actuales_count: cursosActuales.length,
			promedio_historico_general: promedioHistoricoGeneral,
			porcentaje_avance_carrera: porcentajeAvanceCarrera,
			desempeno_historico: desempenoHistorico
		},
		historial_por_periodo: historialPorPeriodo,
		cursos_anteriores: cursosAnteriores,
		cursos_actuales: cursosActuales,
		todos_los_cursos: cursosProcesados
	};
};
