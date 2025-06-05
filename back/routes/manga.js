const express = require('express');
const axios = require('axios');
const router = express.Router();

// Search mangas via Mangadex API
router.get('/search', async (req, res) => {
  const { q } = req.query;
  console.log(q);
  if (!q) return res.status(400).json({ message: 'Query required' });
  try {
    const resp = await axios.get('https://api.mangadex.org/manga', {
      params: { title: q, limit: 10 },
    });
    res.json(resp.data);
  } catch (err) {
    res.status(500).json({ message: 'Mangadex request failed' });
  }
});

// Get chapter pages from Mangadex
router.get('/chapter/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const url = `https://api.mangadex.org/at-home/server/${id}`;
    const resp = await axios.get(url);
    res.json(resp.data);
  } catch {
    res.status(500).json({ message: 'Failed to fetch chapter' });
  }
});

// Get latest chapters from Mangadex
router.get('/latest', async (req, res) => {
  try {
    const resp = await axios.get('https://api.mangadex.org/chapter', {
      params: { limit: 20, 'order[readableAt]': 'desc' },
    });
    res.json(resp.data);
  } catch {
    res.status(500).json({ message: 'Failed to fetch latest chapters' });
  }
});

module.exports = router;
