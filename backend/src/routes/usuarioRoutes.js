import express from 'express';
import {
	getAllUsuariosController,
	getUsuarioByIdController,
	getUsuarioByEmailController,
	getPerfilController,
	createUsuarioController,
	updateUsuarioController,
	updatePasswordController,
	updateEmailController,
	deleteUsuarioController
} from '../controllers/usuarioController.js';
import { login } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authToken.middleware.js';
import {
	validateRegister,
	validateLoginInput,
	validatePasswordUpdate,
	validateEmailUpdate
} from '../middlewares/validate.middleware.js';

const router = express.Router();

// Autenticación
router.post('/login', validateLoginInput, login);

// Endpoint estático de perfil seguro (confía exclusivamente en el JWT)
router.get('/perfil', verifyToken, getPerfilController);
router.get('/me', verifyToken, getPerfilController);

// Rutas de administración y consulta de usuarios (con paginación y búsqueda dinámica)
router.get('/', getAllUsuariosController);
router.get('/:id', getUsuarioByIdController);
router.get('/email/:email', getUsuarioByEmailController);

// Creación de usuarios con validación estricta RegEx en Backend
router.post('/', validateRegister, createUsuarioController);

// Actualización de datos y credenciales
router.put('/:id', updateUsuarioController);
router.put('/:id/password', validatePasswordUpdate, updatePasswordController);
router.put('/:id/email', validateEmailUpdate, updateEmailController);

// Eliminación con verificación de integridad referencial
router.delete('/:id', deleteUsuarioController);

export default router;