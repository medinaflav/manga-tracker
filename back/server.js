const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config(); // Charge .env AVANT tout le reste

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connexion à MongoDB Atlas réussie !"))
  .catch((err) => console.error("❌ Erreur de connexion à MongoDB Atlas :", err.message));

const authRoutes = require("./routes/auth");
const mangaRoutes = require("./routes/manga");
const comickRoutes = require("./routes/comick");
const watchlistRoutes = require("./routes/watchlist");
const mangamoinsRoutes = require("./routes/mangamoins");
const readerRoutes = require("./routes/reader");
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
app.use(helmet());
app.use('/downloads', express.static(path.join(__dirname, '../downloads')));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/manga", mangaRoutes);
app.use("/api/comick", comickRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/mangamoins", mangamoinsRoutes);
app.use("/api/reader", readerRoutes);

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

// Port du serveur
const PORT = process.env.PORT || 3000;

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
