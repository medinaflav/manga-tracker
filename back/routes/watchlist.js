const express = require("express");
const router = express.Router();
const {
  addToWatchlist,
  removeFromWatchlist,
  updateLastRead,
  getWatchlist,
  updateLastChapterComick,
} = require("../services/watchlistService");
const auth = require('../middleware/auth');
const axios = require('axios');

// Add or update manga in watchlist
router.post("/", auth, async (req, res) => {
  const username = req.user;
  const { mangaId, title, lastRead, author, coverUrl, description } = req.body;
  if (!mangaId || !title)
    return res.status(400).json({ message: "mangaId and title required" });
  try {
    await addToWatchlist(username, mangaId, title, lastRead, author, coverUrl, description);
    res.json({ message: "Added or updated" });
  } catch (error) {
    console.error('[WATCHLIST-ROUTE] Error adding to watchlist:', error);
    res.status(500).json({ message: "Error adding to watchlist" });
  }
});

// Remove manga from watchlist
router.delete("/", auth, async (req, res) => {
  const username = req.user;
  const { mangaId } = req.body;
  if (!mangaId)
    return res.status(400).json({ message: "mangaId required" });
  await removeFromWatchlist(username, mangaId);
  res.json({ message: "Removed" });
});

// Get watchlist
router.get("/", auth, async (req, res) => {
  const username = req.user;
  const list = await getWatchlist(username);
  res.json(list);
});

// Update lastRead for a manga
router.post("/lastread", auth, async (req, res) => {
  const username = req.user;
  const { mangaId, lastRead } = req.body;
  if (!mangaId || lastRead === undefined)
    return res.status(400).json({ message: "mangaId and lastRead required" });
  await updateLastRead(username, mangaId, lastRead);
  res.json({ message: "Last read updated" });
});

// PATCH /api/watchlist/last-chapter
router.patch("/last-chapter", auth, async (req, res) => {
  const username = req.user;
  const { mangaId, lastChapterComick } = req.body;
  if (!mangaId || lastChapterComick === undefined)
    return res.status(400).json({ message: "mangaId and lastChapterComick required" });
  await updateLastChapterComick(username, mangaId, lastChapterComick);
  res.json({ message: "Last chapter (Comick) updated" });
});

// GET /api/watchlist/:mangaId/last-chapter-comick
router.get('/:mangaId/last-chapter-comick', auth, async (req, res) => {
  
  const username = req.user;
  const { mangaId } = req.params;
  const { title } = req.query;
  let lastChapterComick = null;
  try {
    const comickRes = await axios.get('https://api.comick.io/v1.0/search', {
      params: { q: title, limit: 1 }
    });
    lastChapterComick = comickRes.data?.[0]?.last_chapter || null;
    
    if (lastChapterComick) {
      // 2. Met à jour la BDD
      await updateLastChapterComick(username, mangaId, lastChapterComick);
      return res.json({ lastChapterComick, source: 'comick' });
    }
  } catch (e) {
    // ignore, fallback below
  }
  // 3. Fallback : retourne la valeur en BDD
  const list = await getWatchlist(username);
  const manga = list.find(m => m.mangaId === mangaId);
  lastChapterComick = manga?.lastChapterComick || null;
  res.json({ lastChapterComick, source: 'db' });
});

module.exports = router;
