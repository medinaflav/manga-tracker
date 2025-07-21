const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");
const mangaRoutes = require("./routes/manga");
const comickRoutes = require("./routes/comick");
const watchlistRoutes = require("./routes/watchlist");
const mangamoinsRoutes = require("./routes/mangamoins");
const helmet = require("helmet");

// Configuration des variables d'environnement
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(helmet());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/manga", mangaRoutes);
app.use("/api/comick", comickRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/mangamoins", mangamoinsRoutes);

// Routes de base
app.get("/", (req, res) => {
  res.json({ message: "Bienvenue sur l'API Manga Tracker" });
});

// Port du serveur
const PORT = process.env.PORT || 3000;

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
