const express = require("express");
const router = express.Router();
const {
  searchMangas,
  getChapterPages,
  getLatestChapters,
  getMangaCoverUrl,
  updateLastChapter,
} = require("../services/mangaService");
const { getScanImages } = require('../services/readerService');
const chapterDetectionService = require('../services/chapterDetectionService');
const axios = require('axios');

// Search mangas via Mangadex API (version normalisée)
router.get("/search", async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Query parameter required' });
  }

  console.log(`Search request for: "${q}"`);

  try {
    // Essayer d'abord avec l'endpoint de recherche (plus flexible)
    try {
      console.log(`Trying search endpoint for: "${q}"`);
      const searchRes = await axios.get(
        `https://api.mangadex.org/manga/search`,
        {
          params: {
            q: q,
            limit: 20,
            includes: ["cover_art"],
          },
          headers: {
            'User-Agent': 'MangaTracker/1.0',
            'Accept': 'application/json',
          },
          timeout: 10000,
        }
      );
      
      if (searchRes.data && searchRes.data.data && searchRes.data.data.length > 0) {
        console.log(`Search endpoint found ${searchRes.data.data.length} results for "${q}"`);
        return res.json({ data: searchRes.data.data });
      } else {
        console.log(`Search endpoint returned no results for "${q}"`);
      }
    } catch (searchError) {
      console.log(`Search endpoint failed for "${q}":`, searchError.message);
    }

    // Si la recherche échoue, essayer avec l'endpoint manga
    try {
      console.log(`Trying title endpoint for: "${q}"`);
      const titleRes = await axios.get(
        `https://api.mangadex.org/manga`,
        {
          params: {
            title: q,
            limit: 20,
            includes: ["cover_art"],
          },
          headers: {
            'User-Agent': 'MangaTracker/1.0',
            'Accept': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (titleRes.data && titleRes.data.data && titleRes.data.data.length > 0) {
        console.log(`Title endpoint found ${titleRes.data.data.length} results for "${q}"`);
        return res.json({ data: titleRes.data.data });
      } else {
        console.log(`Title endpoint returned no results for "${q}"`);
      }
    } catch (titleError) {
      console.log(`Title endpoint failed for "${q}":`, titleError.message);
    }

    console.log(`No results found for "${q}"`);
    return res.json({ data: [] });

  } catch (error) {
    console.error(`Unexpected error for "${q}":`, error.message);
    return res.status(500).json({ error: 'Search failed', details: error.message });
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

// Proxy MangaDex manga details by id
router.get('/mangadex/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`https://api.mangadex.org/manga/${id}`, {
      params: { includes: ['cover_art', 'author'] }
    });
    res.json(response.data);
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

// Proxy MangaDex last chapter number by manga id (max chapter number)
router.get('/mangadex/:id/chapters', async (req, res) => {
  try {
    const { id } = req.params;
    if (req.query.total) {
      return res.json({ totalChapters: parseInt(req.query.total, 10) });
    }
    let offset = 0;
    const limit = 500;
    let hasMore = true;
    let lastChapter = null;
    while (hasMore) {
      const response = await axios.get(`https://api.mangadex.org/manga/${id}/feed`, { params: { limit, offset } });
      const chapters = (response.data.data || [])
        .map((c) => parseFloat(c.attributes.chapter))
        .filter((n) => !isNaN(n));
      if (chapters.length > 0) {
        const max = Math.max(...chapters);
        if (lastChapter === null || max > lastChapter) lastChapter = max;
      }
      offset += limit;
      hasMore = response.data.total > offset;
    }
    res.json({ totalChapters: lastChapter });
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

// Update last chapter for a manga
router.put('/:mangadexId/last-chapter', async (req, res) => {
  const { mangadexId } = req.params;
  const { lastChapter } = req.body;
  
  if (!lastChapter) {
    return res.status(400).json({ error: 'lastChapter is required' });
  }
  
  try {
    const result = await updateLastChapter(mangadexId, lastChapter);
    if (result) {
      res.json({ success: true, manga: result });
    } else {
      res.status(404).json({ error: 'Manga not found' });
    }
  } catch (error) {
    console.error('Error updating last chapter:', error);
    res.status(500).json({ error: 'Failed to update last chapter' });
  }
});

// Detect latest chapter for a manga
router.get('/:mangadexId/detect-chapters', async (req, res) => {
  const { mangadexId } = req.params;
  const { title } = req.query;
  
  if (!title) {
    return res.status(400).json({ error: 'title parameter is required' });
  }
  
  try {
    const result = await chapterDetectionService.detectAndUpdate(mangadexId, title);
    
    if (result) {
      res.json({
        success: true,
        latestChapter: result.chapter,
        source: result.source,
        comickChapter: result.comickChapter,
        mangamoinsChapter: result.mangamoinsChapter
      });
    } else {
      res.json({
        success: false,
        message: 'No chapters found'
      });
    }
  } catch (error) {
    console.error('Chapter detection failed:', error);
    res.status(500).json({ error: 'Chapter detection failed' });
  }
});

module.exports = router;
