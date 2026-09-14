import { validatePassword, validateEmail, validateTextField, PASSWORD_REGEX, EMAIL_REGEX } from '../src/utils/validators.js';

describe('Unit Testing: RegEx y Validaciones de Seguridad (TDD)', () => {

	describe('Validación de Contraseñas (validatePassword)', () => {
		test('Debe aceptar contraseñas válidas que cumplan todas las políticas', () => {
			const validPasswords = [
				'Admin123!',
				'P@ssw0rd2026',
				'Segura#99xY',
				'Clave.Dificil$1',
				'Complex_Pass123'
			];

			validPasswords.forEach(pass => {
				const result = validatePassword(pass);
				expect(result.isValid).toBe(true);
				expect(PASSWORD_REGEX.test(pass)).toBe(true);
			});
		});

		test('Debe rechazar contraseñas con menos de 8 caracteres', () => {
			const shortPass = 'Aa1!xyz';
			const result = validatePassword(shortPass);
			expect(result.isValid).toBe(false);
			expect(result.message).toMatch(/al menos 8 caracteres/i);
		});

		test('Debe rechazar contraseñas sin letras mayúsculas', () => {
			const noUpper = 'password123!';
			const result = validatePassword(noUpper);
			expect(result.isValid).toBe(false);
			expect(result.message).toMatch(/letra mayúscula/i);
		});

		test('Debe rechazar contraseñas sin letras minúsculas', () => {
			const noLower = 'PASSWORD123!';
			const result = validatePassword(noLower);
			expect(result.isValid).toBe(false);
			expect(result.message).toMatch(/letra minúscula/i);
		});

		test('Debe rechazar contraseñas sin números', () => {
			const noNumber = 'Password!@#$';
			const result = validatePassword(noNumber);
			expect(result.isValid).toBe(false);
			expect(result.message).toMatch(/un número/i);
		});

		test('Debe rechazar contraseñas sin caracteres especiales', () => {
			const noSpecial = 'Password123';
			const result = validatePassword(noSpecial);
			expect(result.isValid).toBe(false);
			expect(result.message).toMatch(/carácter especial/i);
		});

		test('Debe manejar valores nulos, vacíos o tipos no válidos', () => {
			expect(validatePassword('').isValid).toBe(false);
			expect(validatePassword(null).isValid).toBe(false);
			expect(validatePassword(undefined).isValid).toBe(false);
			expect(validatePassword(12345678).isValid).toBe(false);
		});
	});

	describe('Validación de Correo Electrónico (validateEmail)', () => {
		test('Debe aceptar correos con formato válido', () => {
			const validEmails = [
				'usuario@dominio.com',
				'estudiante.prog@instituto.edu.ar',
				'contacto_test+info@empresa.org',
				'admin123@sub.dominio.net'
			];

			validEmails.forEach(email => {
				const result = validateEmail(email);
				expect(result.isValid).toBe(true);
				expect(EMAIL_REGEX.test(email)).toBe(true);
			});
		});

		test('Debe rechazar correos con formato inválido', () => {
			const invalidEmails = [
				'correo-sin-arroba.com',
				'@dominio.com',
				'usuario@',
				'usuario@dominio',
				'usuario@.com',
				'usuario con espacios@dominio.com'
			];

			invalidEmails.forEach(email => {
				const result = validateEmail(email);
				expect(result.isValid).toBe(false);
				expect(result.message).toMatch(/inválido/i);
			});
		});

		test('Debe rechazar emails vacíos, nulos o no strings', () => {
			expect(validateEmail('').isValid).toBe(false);
			expect(validateEmail(null).isValid).toBe(false);
			expect(validateEmail(undefined).isValid).toBe(false);
		});
	});

	describe('Validación de Campos de Texto (validateTextField)', () => {
		test('Debe aceptar texto válido dentro del rango de longitud', () => {
			const result = validateTextField('Título de publicación', 'título', 3, 100);
			expect(result.isValid).toBe(true);
		});

		test('Debe rechazar texto menor al mínimo o con solo espacios', () => {
			const result = validateTextField('   ', 'título', 3, 100);
			expect(result.isValid).toBe(false);
		});

		test('Debe rechazar texto que supere la longitud máxima', () => {
			const longText = 'a'.repeat(256);
			const result = validateTextField(longText, 'título', 1, 255);
			expect(result.isValid).toBe(false);
		});
	});

});
