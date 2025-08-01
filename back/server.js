const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config(); // Charge .env AVANT tout le reste

const mongoose = require("mongoose");

// Configuration MongoDB avec plus d'options et de logs
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout plus court
  socketTimeoutMS: 45000,
  bufferCommands: false, // Désactive le buffering
};

console.log("🔍 Tentative de connexion MongoDB...");
console.log("📡 URI:", process.env.MONGO_URI ? "Configuré" : "Non configuré");

mongoose.connect(process.env.MONGO_URI, mongoOptions)
  .then(() => {
    console.log("✅ Connexion à MongoDB Atlas réussie !");
    console.log("🌐 Base de données:", mongoose.connection.name);
  })
  .catch((err) => {
    console.error("❌ Erreur de connexion à MongoDB Atlas :", err.message);
    console.error("🔍 Détails:", err);
  });

// Écouter les événements de connexion
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connecté');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Erreur Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose déconnecté');
});

const authRoutes = require("./routes/auth");
const mangaRoutes = require("./routes/manga");
const comickRoutes = require("./routes/comick");
const watchlistRoutes = require("./routes/watchlist");
const mangamoinsRoutes = require("./routes/mangamoins");
const readerRoutes = require("./routes/reader");
const readingProgressRouter = require('./routes/readingProgress');
const helmet = require("helmet");
const cron = require("node-cron");
const { getLatestChapters, isChapterNotified, markChapterAsNotified } = require("./services/mangamoinsService");
const { default: Expo } = require("expo-server-sdk");
const User = require("./services/authService").User || require("mongoose").model("User");
const path = require('path');

const expo = new Expo();

// Configuration des variables d'environnement

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
        // Ajoute d'autres directives si besoin
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

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/manga", mangaRoutes);
app.use("/api/comick", comickRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/mangamoins", mangamoinsRoutes);
app.use("/api/reader", readerRoutes);
app.use('/api/reading-progress', readingProgressRouter);

// Tâche cron : tous les jours à 15h
cron.schedule("0 15 * * *", async () => {
  console.log("[CRON] Scan Manga Moins...");
  try {
    const chapters = await getLatestChapters();
    for (const chapter of chapters) {
      const alreadyNotified = await isChapterNotified(chapter.title);
      if (!alreadyNotified) {
        // Notifier tous les utilisateurs ayant un token Expo
        const users = await User.find({ expoPushToken: { $ne: null } });
        const messages = users.map(user => ({
          to: user.expoPushToken,
          sound: "default",
          title: `Nouveau scan: ${chapter.manga}`,
          body: `${chapter.title} (${chapter.subtitle}) est dispo !`,
          data: { link: chapter.link },
        }));
        if (messages.length > 0) {
          try {
            await expo.sendPushNotificationsAsync(messages);
            console.log(`[CRON] Notification envoyée pour ${chapter.title}`);
          } catch (err) {
            console.error("[CRON] Erreur envoi notification:", err.message);
          }
        }
        await markChapterAsNotified(chapter.title, chapter.date);
      }
    }
  } catch (err) {
    console.error("[CRON] Erreur scan Manga Moins:", err.message);
  }
});

// Routes de base
app.get("/", (req, res) => {
  res.json({ message: "Bienvenue sur l'API Manga Tracker" });
});

// Endpoint de santé pour la détection automatique
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    message: "Backend is running" 
  });
});

// Port du serveur
const PORT = process.env.PORT || 3000;

// Démarrage du serveur - écouter sur toutes les interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`🌐 Accessible sur:`);
  console.log(`   - Local: http://localhost:${PORT}`);
  console.log(`   - Network: http://192.168.1.83:${PORT}`);
});
