const express = require("express");
const router = express.Router();
const {
  searchMangas,
  getChapterPages,
  getLatestChapters,
  getMangaCoverUrl,
} = require("../services/mangaService");
const { getScanImages } = require('../services/readerService');

// Search mangas via Mangadex API
router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: "Query required" });
  try {
    const data = await searchMangas(q);
    res.json(data);
  } catch {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des mangas" });
  }
});

// Get chapter pages from Mangadex
router.get("/chapter/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const data = await getChapterPages(id);
    res.json(data);
  } catch {
    res.status(500).json({ message: "Failed to fetch chapter" });
  }
});

// Get latest chapters from Mangadex
router.get("/latest", async (req, res) => {
  try {
    const data = await getLatestChapters();
    res.json(data);
  } catch {
    res.status(500).json({ message: "Failed to fetch latest chapters" });
  }
});

// Get manga cover by title
router.get('/cover', async (req, res) => {
  const { title } = req.query;
  if (!title) return res.status(400).json({ message: 'Title required' });
  try {
    const url = await getMangaCoverUrl(title);
    if (!url) return res.status(404).json({ message: 'Cover not found' });
    res.json({ url });
  } catch {
    res.status(500).json({ message: 'Failed to fetch cover' });
  }
});

// Get scan images by code
router.get('/scan', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ message: 'Scan code required' });
  try {
    const images = await getScanImages(code);
    if (!images || images.length === 0) return res.status(404).json({ message: 'No images found' });
    res.json({ images });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch scan images' });
  }
});

module.exports = router;
