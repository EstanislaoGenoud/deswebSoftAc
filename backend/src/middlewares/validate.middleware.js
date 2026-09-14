import { validatePassword, validateEmail, validateTextField } from '../utils/validators.js';

/**
 * Middleware para validar los datos de registro de un usuario.
 * Aplica RegEx antes de ejecutar cualquier hash o inserción en la BD.
 */
export const validateRegister = (req, res, next) => {
	const { nombre, apellido, email, password } = req.body || {};

	const nombreVal = validateTextField(nombre, 'nombre', 2, 50);
	if (!nombreVal.isValid) {
		return res.status(400).json({
			error: 'Validación fallida',
			message: nombreVal.message,
			field: 'nombre'
		});
	}

	const apellidoVal = validateTextField(apellido, 'apellido', 2, 50);
	if (!apellidoVal.isValid) {
		return res.status(400).json({
			error: 'Validación fallida',
			message: apellidoVal.message,
			field: 'apellido'
		});
	}

	const emailVal = validateEmail(email);
	if (!emailVal.isValid) {
		return res.status(400).json({
			error: 'Validación fallida',
			message: emailVal.message,
			field: 'email'
		});
	}

	const passVal = validatePassword(password);
	if (!passVal.isValid) {
		return res.status(400).json({
			error: 'Validación fallida',
			message: passVal.message,
			field: 'password'
		});
	}

	next();
};

/**
 * Middleware para validar datos de inicio de sesión.
 */
export const validateLoginInput = (req, res, next) => {
	const { email, password } = req.body || {};

	if (!email || !password) {
		return res.status(400).json({
			error: 'Validación fallida',
			message: 'El email y la contraseña son requeridos'
		});
	}

	const emailVal = validateEmail(email);
	if (!emailVal.isValid) {
		return res.status(400).json({
			error: 'Validación fallida',
			message: emailVal.message,
			field: 'email'
		});
	}

	next();
};

/**
 * Middleware para validar actualización de contraseña.
 */
export const validatePasswordUpdate = (req, res, next) => {
	const { password } = req.body || {};
	const passVal = validatePassword(password);
	if (!passVal.isValid) {
		return res.status(400).json({
			error: 'Validación fallida',
			message: passVal.message,
			field: 'password'
		});
	}
	next();
};

/**
 * Middleware para validar actualización de correo electrónico.
 */
export const validateEmailUpdate = (req, res, next) => {
	const { email } = req.body || {};
	const emailVal = validateEmail(email);
	if (!emailVal.isValid) {
		return res.status(400).json({
			error: 'Validación fallida',
			message: emailVal.message,
			field: 'email'
		});
	}
	next();
};

/**
 * Middleware para validar la creación o actualización de una Publicación.
 * Garantiza que el body contenga solo los campos requeridos
 * y descarta cualquier autor_id que intente inyectar el cliente.
 */
export const validatePublicacion = (req, res, next) => {
	const { titulo, contenido } = req.body || {};

	// Descartar autor_id del body para evitar suplantación de identidad
	if (req.body && req.body.autor_id !== undefined) {
		delete req.body.autor_id;
	}

	const tituloVal = validateTextField(titulo, 'título', 3, 200);
	if (!tituloVal.isValid) {
		return res.status(400).json({
			error: 'Validación fallida',
			message: tituloVal.message,
			field: 'titulo'
		});
	}

	const contenidoVal = validateTextField(contenido, 'contenido', 5, 5000);
	if (!contenidoVal.isValid) {
		return res.status(400).json({
			error: 'Validación fallida',
			message: contenidoVal.message,
			field: 'contenido'
		});
	}

	next();
};
