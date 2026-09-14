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
