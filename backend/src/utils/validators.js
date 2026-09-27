/**
 * Módulo de validación con Expresiones Regulares (RegEx).
 * Aplica reglas estrictas en el Backend para garantizar seguridad y robustez
 * antes de interactuar con la base de datos o ejecutar algoritmos criptográficos (bcrypt).
 */

// RegEx de contraseña segura:
// - Mínimo 8 caracteres
// - Al menos una letra minúscula (?=.*[a-z])
// - Al menos una letra mayúscula (?=.*[A-Z])
// - Al menos un número (?=.*\d)
// - Al menos un carácter especial (?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`])
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]).{8,}$/;

// RegEx de email estándar
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Valida la robustez de una contraseña.
 * @param {string} password - Contraseña a evaluar.
 * @returns {{ isValid: boolean, message?: string }}
 */
export const validatePassword = (password) => {
	if (!password || typeof password !== 'string') {
		return {
			isValid: false,
			message: 'La contraseña es requerida y debe ser una cadena de texto'
		};
	}

	if (password.length < 8) {
		return {
			isValid: false,
			message: 'La contraseña debe tener al menos 8 caracteres'
		};
	}

	if (!/[a-z]/.test(password)) {
		return {
			isValid: false,
			message: 'La contraseña debe contener al menos una letra minúscula'
		};
	}

	if (!/[A-Z]/.test(password)) {
		return {
			isValid: false,
			message: 'La contraseña debe contener al menos una letra mayúscula'
		};
	}

	if (!/\d/.test(password)) {
		return {
			isValid: false,
			message: 'La contraseña debe contener al menos un número'
		};
	}

	if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
		return {
			isValid: false,
			message: 'La contraseña debe contener al menos un carácter especial (!@#$%^&*...)'
		};
	}

	if (!PASSWORD_REGEX.test(password)) {
		return {
			isValid: false,
			message: 'La contraseña no cumple con los requisitos de seguridad'
		};
	}

	return { isValid: true };
};

/**
 * Valida el formato de un correo electrónico.
 * @param {string} email - Email a evaluar.
 * @returns {{ isValid: boolean, message?: string }}
 */
export const validateEmail = (email) => {
	if (!email || typeof email !== 'string') {
		return {
			isValid: false,
			message: 'El correo electrónico es requerido y debe ser una cadena de texto'
		};
	}

	const trimmedEmail = email.trim();

	if (!EMAIL_REGEX.test(trimmedEmail)) {
		return {
			isValid: false,
			message: 'El formato del correo electrónico es inválido'
		};
	}

	return { isValid: true };
};

/**
 * Valida campos de texto no vacíos (para títulos, nombres, etc.)
 * @param {string} text - Texto a evaluar.
 * @param {string} fieldName - Nombre del campo para el mensaje.
 * @param {number} minLength - Longitud mínima requerida (por defecto 1).
 * @param {number} maxLength - Longitud máxima permitida (por defecto 255).
 * @returns {{ isValid: boolean, message?: string }}
 */
export const validateTextField = (text, fieldName = 'campo', minLength = 1, maxLength = 255) => {
	if (!text || typeof text !== 'string' || text.trim().length < minLength) {
		return {
			isValid: false,
			message: `El ${fieldName} es requerido y debe contener al menos ${minLength} carácter(es)`
		};
	}

	if (text.trim().length > maxLength) {
		return {
			isValid: false,
			message: `El ${fieldName} no puede exceder los ${maxLength} caracteres`
		};
	}

	return { isValid: true };
};

// RegEx de código de curso (letras, números, guiones medios y bajos, de 2 a 50 caracteres)
export const CODIGO_CURSO_REGEX = /^[a-zA-Z0-9_-]{2,50}$/;

/**
 * Valida los datos requeridos para la creación o actualización de un Curso (HU-05 #87, #93).
 * Datos requeridos:
 * - codigo: string no vacío, 2-50 caracteres, formato alfanumérico con guiones.
 * - nombre: string no vacío, 3-150 caracteres.
 * Datos opcionales con límites:
 * - descripcion: string hasta 2000 caracteres.
 * - comision: string hasta 50 caracteres.
 * - periodo: string hasta 50 caracteres.
 * - aula: string hasta 50 caracteres.
 * - horario: string hasta 100 caracteres.
 * - cupo_maximo: entero entre 1 y 500.
 * @param {object} curso 
 * @returns {{ isValid: boolean, message?: string, field?: string }}
 */
export const validateCursoInput = (curso = {}) => {
	if (!curso || typeof curso !== 'object') {
		return { isValid: false, message: 'El cuerpo de la petición no contiene datos válidos' };
	}

	const { codigo, nombre, descripcion, escuela_id, comision, periodo, aula, horario, cupo_maximo } = curso;

	// Validación de Código Requerido
	const codigoVal = validateTextField(codigo, 'código', 2, 50);
	if (!codigoVal.isValid) {
		return { isValid: false, message: codigoVal.message, field: 'codigo' };
	}

	if (!CODIGO_CURSO_REGEX.test(codigo.trim())) {
		return {
			isValid: false,
			message: 'El código del curso solo puede contener letras, números, guiones y guiones bajos (sin espacios)',
			field: 'codigo'
		};
	}

	// Validación de Nombre Requerido
	const nombreVal = validateTextField(nombre, 'nombre del curso', 3, 150);
	if (!nombreVal.isValid) {
		return { isValid: false, message: nombreVal.message, field: 'nombre' };
	}

	// Validación de Escuela Asociada (#109)
	if (escuela_id !== undefined && escuela_id !== null && escuela_id !== '') {
		const escuelaNum = Number(escuela_id);
		if (!Number.isInteger(escuelaNum) || escuelaNum <= 0) {
			return {
				isValid: false,
				message: 'El identificador de escuela debe ser un número entero positivo',
				field: 'escuela_id'
			};
		}
	}

	// Validaciones de campos opcionales
	if (descripcion && typeof descripcion === 'string' && descripcion.trim().length > 2000) {
		return {
			isValid: false,
			message: 'La descripción no puede superar los 2000 caracteres',
			field: 'descripcion'
		};
	}

	if (comision && typeof comision === 'string' && comision.trim().length > 50) {
		return {
			isValid: false,
			message: 'El nombre de la comisión no puede superar los 50 caracteres',
			field: 'comision'
		};
	}

	if (periodo && typeof periodo === 'string' && periodo.trim().length > 50) {
		return {
			isValid: false,
			message: 'El período académico no puede superar los 50 caracteres',
			field: 'periodo'
		};
	}

	if (aula && typeof aula === 'string' && aula.trim().length > 50) {
		return {
			isValid: false,
			message: 'El campo de aula no puede superar los 50 caracteres',
			field: 'aula'
		};
	}

	if (horario && typeof horario === 'string' && horario.trim().length > 100) {
		return {
			isValid: false,
			message: 'El horario no puede superar los 100 caracteres',
			field: 'horario'
		};
	}

	if (cupo_maximo !== undefined && cupo_maximo !== null && cupo_maximo !== '') {
		const cupoNum = Number(cupo_maximo);
		if (!Number.isInteger(cupoNum) || cupoNum <= 0 || cupoNum > 500) {
			return {
				isValid: false,
				message: 'El cupo máximo debe ser un número entero entre 1 y 500',
				field: 'cupo_maximo'
			};
		}
	}

	return { isValid: true };
};

/**
 * Valida los datos requeridos para asociar un curso a una escuela (HU-44 #108, #109).
 * @param {object} data 
 * @returns {{ isValid: boolean, message?: string, field?: string }}
 */
export const validateAsociacionEscuelaInput = (data) => {
	const { escuela_id } = data || {};
	if (escuela_id === undefined || escuela_id === null || escuela_id === '') {
		return {
			isValid: false,
			message: 'El campo escuela_id es requerido para realizar la asociación',
			field: 'escuela_id'
		};
	}

	const escuelaNum = Number(escuela_id);
	if (!Number.isInteger(escuelaNum) || escuelaNum <= 0) {
		return {
			isValid: false,
			message: 'El identificador de escuela debe ser un número entero positivo',
			field: 'escuela_id'
		};
	}

	return { isValid: true };
};

/**
 * Valida los datos requeridos para la inscripción de un alumno en un curso (HU-45 #115).
 * @param {object} data
 * @returns {{ isValid: boolean, message?: string, field?: string }}
 */
export const validateInscripcionAlumnoInput = (data) => {
	const { alumno_id } = data || {};
	if (alumno_id === undefined || alumno_id === null || alumno_id === '') {
		return {
			isValid: false,
			message: 'El campo alumno_id es requerido para realizar la inscripción',
			field: 'alumno_id'
		};
	}

	const alumnoNum = Number(alumno_id);
	if (!Number.isInteger(alumnoNum) || alumnoNum <= 0) {
		return {
			isValid: false,
			message: 'El identificador de alumno debe ser un número entero positivo',
			field: 'alumno_id'
		};
	}

	return { isValid: true };
};




