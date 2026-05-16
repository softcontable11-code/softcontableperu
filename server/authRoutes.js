const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const dbManager = require('./databaseServer');

const JWT_SECRET = process.env.JWT_SECRET || 'softcontable-super-secret-key-2026';

// --- REGISTRO ---
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Verificar si ya existe
        const existingUser = dbManager.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'El correo ya está registrado' });
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            id: uuidv4(),
            email,
            password: hashedPassword,
            name
        };

        dbManager.createUser(newUser);

        res.json({ success: true, message: 'Usuario registrado exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- LOGIN ---
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = dbManager.getUserByEmail(email);
        if (!user) {
            return res.status(400).json({ success: false, error: 'Usuario o contraseña incorrectos' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, error: 'Usuario o contraseña incorrectos' });
        }

        // Crear Token
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: { id: user.id, email: user.email, name: user.name }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
