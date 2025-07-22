const express = require("express");
const router = express.Router();
const { register, login, updateExpoPushToken } = require("../services/authService");

// Register a new user
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  console.log("[REGISTER] Tentative d'inscription:", { username });
  try {
    await register(username, password);
    console.log("[REGISTER] Succès pour:", username);
    res.json({ message: "User registered" });
  } catch (err) {
    console.error("[REGISTER] Erreur:", err.message);
    res.status(400).json({ message: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log("[LOGIN] Tentative de connexion:", { username });
  try {
    const result = await login(username, password);
    console.log("[LOGIN] Succès pour:", username);
    res.json(result);
  } catch (err) {
    console.error("[LOGIN] Erreur:", err.message);
    res.status(400).json({ message: err.message });
  }
});

// Enregistrer le token Expo Push
router.post("/expoPushToken", async (req, res) => {
  const { username, expoPushToken } = req.body;
  if (!username || !expoPushToken) {
    return res.status(400).json({ message: "username and expoPushToken required" });
  }
  try {
    await updateExpoPushToken(username, expoPushToken);
    res.json({ message: "Expo push token updated" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
