const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const helmet = require("helmet");
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: [
          "'self'",
          'data:',
          process.env.NODE_ENV === 'development'
            ? 'http://localhost:3000'
            : 'https://mon-api-prod.com'
        ],
      }
    }
  })
);

app.use(
  '/downloads',
  express.static(path.join(__dirname, '../downloads'), {
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  })
);

// Mock data pour les fonctionnalités qui nécessitent MongoDB
const mockWatchlist = [];
const mockReadingProgress = {};

// Mock routes pour remplacer les routes MongoDB
app.get("/api/watchlist", (req, res) => {
  console.log("📋 Mock: Getting watchlist");
  res.json(mockWatchlist);
});

app.post("/api/watchlist", (req, res) => {
  console.log("📋 Mock: Adding to watchlist", req.body);
  const { mangaId, title, lastRead, author, coverUrl, description } = req.body;
  const existingIndex = mockWatchlist.findIndex(item => item.mangaId === mangaId);
  
  if (existingIndex >= 0) {
    mockWatchlist[existingIndex] = { mangaId, title, lastRead, author, coverUrl, description };
  } else {
    mockWatchlist.push({ mangaId, title, lastRead, author, coverUrl, description });
  }
  
  res.json({ success: true, message: "Added to watchlist" });
});

app.delete("/api/watchlist", (req, res) => {
  console.log("📋 Mock: Removing from watchlist", req.body);
  const { mangaId } = req.body;
  const index = mockWatchlist.findIndex(item => item.mangaId === mangaId);
  if (index >= 0) {
    mockWatchlist.splice(index, 1);
  }
  res.json({ success: true, message: "Removed from watchlist" });
});

app.post("/api/watchlist/lastread", (req, res) => {
  console.log("📋 Mock: Updating last read", req.body);
  const { mangaId, lastRead } = req.body;
  const item = mockWatchlist.find(item => item.mangaId === mangaId);
  if (item) {
    item.lastRead = lastRead;
  }
  res.json({ success: true, message: "Last read updated" });
});

app.get("/api/reading-progress", (req, res) => {
  console.log("📊 Mock: Getting reading progress");
  res.json(mockReadingProgress);
});

app.post("/api/reading-progress", (req, res) => {
  console.log("📊 Mock: Updating reading progress", req.body);
  const { mangaId, chapter, progress } = req.body;
  mockReadingProgress[mangaId] = { chapter, progress, updatedAt: new Date() };
  res.json({ success: true, message: "Progress updated" });
});

// Import des routes qui ne nécessitent pas MongoDB
const mangaRoutes = require("./routes/manga");
const comickRoutes = require("./routes/comick");
const mangamoinsRoutes = require("./routes/mangamoins");
const readerRoutes = require("./routes/reader");

// API routes
app.use("/api/manga", mangaRoutes);
app.use("/api/comick", comickRoutes);
app.use("/api/mangamoins", mangamoinsRoutes);
app.use("/api/reader", readerRoutes);

// Endpoint de santé
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    message: "Backend is running (No MongoDB mode)",
    mode: "mock"
  });
});

// Routes de base
app.get("/", (req, res) => {
  res.json({ 
    message: "Manga Tracker API (No MongoDB mode)",
    features: {
      search: "✅ Working",
      watchlist: "✅ Mock mode",
      readingProgress: "✅ Mock mode",
      auth: "❌ Disabled"
    }
  });
});

// Port du serveur
const PORT = process.env.PORT || 3000;

// Démarrage du serveur - écouter sur toutes les interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Serveur démarré (No MongoDB mode) sur le port ${PORT}`);
  console.log(`🌐 Accessible sur:`);
  console.log(`   - Local: http://localhost:${PORT}`);
  console.log(`   - Network: http://192.168.1.83:${PORT}`);
  console.log(`📋 Mode: Mock data (pas de MongoDB)`);
  console.log(`🔗 Health check: http://192.168.1.83:${PORT}/health`);
}); 