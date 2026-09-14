import jwt from 'jsonwebtoken';

const verifyToken = (req, res, next) => {
	try {
		const authHeader = req.headers['authorization'] || req.headers['Authorization'];
		if (!authHeader) {
			return res.status(401).json({
				error: 'Acceso denegado',
				message: 'Token de autenticación no proporcionado'
			});
		}
		let token = authHeader;
		if (authHeader.startsWith('Bearer ')) {
			token = authHeader.slice(7).trim();
		}
		if (!token) {
			return res.status(401).json({
				error: 'Token no válido',
				message: 'Formato de token no válido'
			});
		}
		const secret = process.env.JWT_SECRET;
		if (!secret) {
			console.error('ERROR: JWT_SECRET no está configurado en las variables de entorno (.env)');
			return res.status(500).json({ error: 'Error interno en la configuración de autenticación' });
		}
		const decodedToken = jwt.verify(token, secret);
		req.usuario = decodedToken;
		req.userData = decodedToken;
		req.user = decodedToken;
		next();
	} catch (error) {
		if (error.name === 'TokenExpiredError') {
			return res.status(401).json({
				error: 'Token expirado',
				message: 'La sesión ha expirado, por favor inicie sesión nuevamente'
			});
		}
		return res.status(401).json({
			error: 'Autenticación fallida',
			message: 'Token inválido o corrupto'
		});
	}
};

export { verifyToken };