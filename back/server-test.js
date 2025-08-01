const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    message: "Backend is running",
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
});

// Test API endpoint
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "API is working!",
    timestamp: new Date().toISOString()
  });
});

// Routes de base
app.get("/", (req, res) => {
  res.json({ message: "Test Backend - Bienvenue sur l'API Manga Tracker" });
});

// Port du serveur
const PORT = process.env.PORT || 3000;

// Démarrage du serveur - écouter sur toutes les interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Serveur de test démarré sur le port ${PORT}`);
  console.log(`🌐 Accessible sur:`);
  console.log(`   - Local: http://localhost:${PORT}`);
  console.log(`   - Network: http://192.168.1.83:${PORT}`);
  console.log(`🔗 Test endpoints:`);
  console.log(`   - Health: http://192.168.1.83:${PORT}/health`);
  console.log(`   - API: http://192.168.1.83:${PORT}/api/test`);
}); 