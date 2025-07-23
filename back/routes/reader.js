const express = require('express');
const router = express.Router();
const { getLocalImages, downloadChapterImages } = require('../services/scanvfService');

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/×/g, 'x')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

// GET /api/reader/:manga/:chapter
router.get('/:manga/:chapter', async (req, res) => {
  const { manga, chapter } = req.params;
  console.log(`[Reader] Requête reçue pour manga: "${manga}", chapitre: "${chapter}"`);
  try {
    // 1. Cherche en local
    let images = getLocalImages(manga, chapter);
    if (images.length > 0) {
      console.log(`[Reader] Images trouvées en local pour "${manga}" chapitre "${chapter}" (${images.length} images)`);
      return res.json({ images, source: 'scan-vf' });
    }
    // 2. Tente de télécharger
    console.log(`[Reader] Aucune image locale trouvée, tentative de téléchargement pour "${manga}" chapitre "${chapter}"`);
    images = await downloadChapterImages(manga, chapter);
    if (images.length > 0) {
      console.log(`[Reader] Images téléchargées avec succès pour "${manga}" chapitre "${chapter}" (${images.length} images)`);
      return res.json({ images, source: 'scan-vf' });
    }
    // 3. Fallback SushiScan
    console.log(`[Reader] Impossible de trouver ou télécharger les images pour "${manga}" chapitre "${chapter}". Redirection vers SushiScan.`);
    const slug = slugify(manga);
    const url = `https://sushiscan.net/${slug}-chapitre-${chapter}/`;
    return res.json({ url, source: 'sushiscan' });
  } catch (err) {
    // console.error(`[Reader] Erreur lors du traitement de "${manga}" chapitre "${chapter}":`, err);
    // Fallback SushiScan en cas d'erreur
    const slug = slugify(manga);
    const url = `https://sushiscan.net/${slug}-chapitre-${chapter}/`;
    return res.json({ url, source: 'sushiscan' });
  }
});

module.exports = router; 