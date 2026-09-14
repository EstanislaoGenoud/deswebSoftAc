import express from 'express';
import {
	createPublicacionController,
	getPublicacionesController,
	getPublicacionByIdController,
	updatePublicacionController,
	deletePublicacionController
} from '../controllers/publicacionController.js';
import { verifyToken } from '../middlewares/authToken.middleware.js';
import { validatePublicacion } from '../middlewares/validate.middleware.js';

const router = express.Router();

// Rutas de lectura (soporta paginación y búsqueda dinámica con LIKE)
router.get('/', getPublicacionesController);
router.get('/:id', getPublicacionByIdController);

// Rutas protegidas que delegan identidad al Token y verifican propiedad
router.post('/', verifyToken, validatePublicacion, createPublicacionController);
router.put('/:id', verifyToken, validatePublicacion, updatePublicacionController);
router.delete('/:id', verifyToken, deletePublicacionController);

export default router;
