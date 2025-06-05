const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Configuration des variables d'environnement
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes de base
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API Manga Tracker' });
});

// Port du serveur
const PORT = process.env.PORT || 5000;

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
}); 