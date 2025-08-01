const express = require('express');
const router = express.Router();
const { saveProgress, getProgressForUser, deleteProgressForManga, deleteProgressForMangaByTitle, cleanupOrphanedProgress } = require('../services/readingProgressService');
const { auth } = require('../services/watchlistService'); // Ajout

// Enregistrer ou mettre à jour la progression
router.post('/', auth, async (req, res) => {
  const username = req.user;
  const { mangaId, mangaTitle, chapterId, page } = req.body;
  if (!mangaId || !chapterId || typeof page !== 'number') {
    return res.status(400).json({ error: 'Missing fields' });
  }
  
  try {
    // Déterminer si mangaId est un slug ou un mangadexId
    let mangadexId = mangaId;
    let finalMangaTitle = mangaTitle;
    
    // Si c'est un slug (contient des tirets et pas d'UUID), chercher le manga par slug
    if (mangaId.includes('-') && !mangaId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const { getMangaBySlug } = require('../services/mangaService');
      const manga = await getMangaBySlug(mangaId);
      if (manga) {
        mangadexId = manga.mangadexId;
        finalMangaTitle = manga.title;
        console.log(`[READING-PROGRESS] Converted slug ${mangaId} to mangadexId ${mangadexId}`);
      } else {
        // Si le manga n'existe pas en base, essayer de le récupérer depuis MangaDex
        try {
          const axios = require('axios');
          const response = await axios.get(`https://api.mangadex.org/manga?title=${encodeURIComponent(mangaTitle)}`);
          const mangaData = response.data?.data;
          if (mangaData && mangaData.length > 0) {
            mangadexId = mangaData[0].id;
            finalMangaTitle = mangaData[0].attributes?.title?.en || Object.values(mangaData[0].attributes?.title || {})[0] || mangaTitle;
            console.log(`[READING-PROGRESS] Found mangadexId ${mangadexId} for title ${mangaTitle} from MangaDex`);
          } else {
            console.log(`[READING-PROGRESS] Manga not found for slug: ${mangaId}, using as mangadexId`);
          }
        } catch (error) {
          console.log(`[READING-PROGRESS] Error fetching from MangaDex: ${error.message}, using slug as mangadexId`);
        }
      }
    }
    
    await saveProgress(username, mangadexId, finalMangaTitle, chapterId, page);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Récupérer la liste des lectures en cours
router.get('/', auth, async (req, res) => {
  const username = req.user;
  try {
    // Nettoyer les enregistrements orphelins avant de récupérer les données
    await cleanupOrphanedProgress();
    
    const progress = await getProgressForUser(username);
    res.json({ data: progress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Supprimer la progression de lecture d'un manga
router.delete('/:mangaId', auth, async (req, res) => {
  const username = req.user;
  const { mangaId } = req.params;
  
  if (!mangaId) {
    return res.status(400).json({ error: 'mangaId required' });
  }
  
  try {
    console.log(`[READING-PROGRESS] Deleting progress for user: ${username}, manga: ${mangaId}`);
    
    // Déterminer si mangaId est un slug ou un mangadexId
    let mangadexId = mangaId;
    
    // Si c'est un slug (contient des tirets et pas d'UUID), chercher le manga par slug
    if (mangaId.includes('-') && !mangaId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const { getMangaBySlug } = require('../services/mangaService');
      const manga = await getMangaBySlug(mangaId);
      if (manga) {
        mangadexId = manga.mangadexId;
        console.log(`[READING-PROGRESS] Converted slug ${mangaId} to mangadexId ${mangadexId} for deletion`);
      } else {
        // Si le manga n'existe pas en base, essayer de le récupérer depuis MangaDex
        try {
          const axios = require('axios');
          const response = await axios.get(`https://api.mangadex.org/manga?title=${encodeURIComponent(mangaId.replace(/-/g, ' '))}`);
          const mangaData = response.data?.data;
          if (mangaData && mangaData.length > 0) {
            mangadexId = mangaData[0].id;
            console.log(`[READING-PROGRESS] Found mangadexId ${mangadexId} for slug ${mangaId} from MangaDex for deletion`);
          } else {
            console.log(`[READING-PROGRESS] Manga not found for slug: ${mangaId}, using as mangadexId`);
          }
        } catch (error) {
          console.log(`[READING-PROGRESS] Error fetching from MangaDex: ${error.message}, using slug as mangadexId`);
        }
      }
    }
    
    const result = await deleteProgressForManga(username, mangadexId);
    console.log(`[READING-PROGRESS] Delete result:`, result);
    
    res.json({ success: true, message: 'Progress deleted', deletedCount: result.deletedCount });
  } catch (err) {
    console.error(`[READING-PROGRESS] Delete error:`, err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 