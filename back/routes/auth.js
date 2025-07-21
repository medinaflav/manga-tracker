const express = require("express");
const router = express.Router();
const { register, login } = require("../services/authService");

// Register a new user
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    await register(username, password);
    res.json({ message: "User registered" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await login(username, password);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
