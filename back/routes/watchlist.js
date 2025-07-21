const express = require("express");
const router = express.Router();
const {
  auth,
  addToWatchlist,
  getWatchlist,
  updateProgress,
  getProgress,
} = require("../services/watchlistService");

// Add manga to watchlist
router.post("/", auth, (req, res) => {
  const username = req.user;
  const { mangaId, title } = req.body;
  if (!mangaId || !title)
    return res.status(400).json({ message: "mangaId and title required" });
  addToWatchlist(username, mangaId, title);
  res.json({ message: "Added" });
});

// Get watchlist
router.get("/", auth, (req, res) => {
  const username = req.user;
  res.json(getWatchlist(username));
});

// Update reading progress
router.post("/progress", auth, (req, res) => {
  const username = req.user;
  const { mangaId, chapterId, read } = req.body;
  if (!mangaId || !chapterId)
    return res.status(400).json({ message: "mangaId and chapterId required" });
  updateProgress(username, mangaId, chapterId, read);
  res.json({ message: "Progress updated" });
});

router.get("/progress/:mangaId", auth, (req, res) => {
  const username = req.user;
  const { mangaId } = req.params;
  res.json(getProgress(username, mangaId));
});

module.exports = router;
