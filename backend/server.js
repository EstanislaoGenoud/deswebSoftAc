import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import usuarioRoutes from './src/routes/usuarioRoutes.js';
import publicacionRoutes from './src/routes/publicacionRoutes.js';
import { verifyToken } from './src/middlewares/authToken.middleware.js';
import { getPerfilController } from './src/controllers/usuarioController.js';

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Ruta raíz informativa
app.get('/', (req, res) => {
	res.json({
		nombre: 'API Sistema de Gestión Académico',
		version: '1.0.0',
		estado: 'Operativo',
		endpoints: {
			auth: 'POST /api/v1/usuarios/login',
			perfil: 'GET /perfil (o GET /api/v1/usuarios/perfil)',
			usuarios: 'GET, POST /api/v1/usuarios',
			publicaciones: 'GET, POST, PUT, DELETE /api/v1/publicaciones'
		}
	});
});

// Endpoint estático directo para perfil seguro (según requerimiento GET /perfil)
app.get('/perfil', verifyToken, getPerfilController);

// Rutas agrupadas de la API v1
app.use('/api/v1/usuarios', usuarioRoutes);
app.use('/api/v1/publicaciones', publicacionRoutes);

// Manejo de rutas inexistentes (404)
app.use((req, res) => {
	res.status(404).json({
		error: 'Ruta no encontrada',
		message: `El endpoint ${req.method} ${req.originalUrl} no existe en este servidor`
	});
});

// Inicialización del servidor solo si no es requerido en modo test
if (process.env.NODE_ENV !== 'test') {
	app.listen(PORT, () => {
		console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
	});
}

export default app;