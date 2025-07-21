const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

// In-memory users store (for demo purposes only)
const users = [];

// Register a new user
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  console.log(`[REGISTER] Tentative d'inscription pour:`, username);
  if (!username || !password) {
    console.log(`[REGISTER] Champs manquants`);
    return res.status(400).json({ message: 'Username and password required' });
  }
  const existing = users.find((u) => u.username === username);
  if (existing) {
    console.log(`[REGISTER] Utilisateur déjà existant:`, username);
    return res.status(400).json({ message: 'User already exists' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = { username, password: hashed };
  users.push(user);
  console.log(`[REGISTER] Inscription réussie pour:`, username);
  res.json({ message: 'User registered' });
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(`[LOGIN] Tentative de connexion pour:`, username);
  const user = users.find((u) => u.username === username);
  if (!user) {
    console.log(`[LOGIN] Utilisateur non trouvé:`, username);
    return res.status(400).json({ message: 'Invalid credentials' });
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    console.log(`[LOGIN] Mot de passe incorrect pour:`, username);
    return res.status(400).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ username }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d',
  });
  console.log(`[LOGIN] Connexion réussie pour:`, username);
  res.json({ token });
});

module.exports = router;
