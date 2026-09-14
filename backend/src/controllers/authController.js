import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { getUsuarioByEmail } from '../models/usuarioModel.js';

const login = async (req, res) => {
	try {
		const { email, password } = req.body || {};

		if (!email || !password) {
			return res.status(400).json({ message: 'El email y la contraseña son requeridos' });
		}

		const [usuario] = await getUsuarioByEmail(email);
		if (!usuario) {
			return res.status(401).json({ message: 'Credenciales Inválidas' });
		}
		const passValida = await bcrypt.compare(password, usuario.contrasena);
		if (!passValida) {
			return res.status(401).json({ message: 'Credenciales Inválidas' });
		}
		const payload = {
			id: usuario.id,
			email: usuario.email,
			rol_id: usuario.rol_id
		};
		const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
		res.status(200).json({ token });

	} catch (err) {
		console.error('Error en el login:', err);
		res.status(500).json({ message: 'Error interno del servidor', error: err.message });
	}
}
export { login };	