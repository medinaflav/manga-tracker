const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// In-memory store per user
const watchlists = {};
const progress = {};

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = payload.username;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Add manga to watchlist
router.post('/', auth, (req, res) => {
  const username = req.user;
  const { mangaId, title } = req.body;
  if (!mangaId || !title) return res.status(400).json({ message: 'mangaId and title required' });
  watchlists[username] = watchlists[username] || [];
  if (!watchlists[username].find((m) => m.mangaId === mangaId)) {
    watchlists[username].push({ mangaId, title });
  }
  res.json({ message: 'Added' });
});

// Get watchlist
router.get('/', auth, (req, res) => {
  const username = req.user;
  res.json(watchlists[username] || []);
});

// Update reading progress
router.post('/progress', auth, (req, res) => {
  const username = req.user;
  const { mangaId, chapterId, read } = req.body;
  if (!mangaId || !chapterId) return res.status(400).json({ message: 'mangaId and chapterId required' });
  progress[username] = progress[username] || {};
  progress[username][mangaId] = progress[username][mangaId] || {};
  progress[username][mangaId][chapterId] = !!read;
  res.json({ message: 'Progress updated' });
});

router.get('/progress/:mangaId', auth, (req, res) => {
  const username = req.user;
  const { mangaId } = req.params;
  res.json(progress[username]?.[mangaId] || {});
});

module.exports = router;
