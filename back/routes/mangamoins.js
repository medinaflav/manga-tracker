const express = require('express');
const axios = require('axios');

const router = express.Router();

// URL du site à scraper
const MANGA_SITE_URL = 'https://mangamoins.shaeishu.co/';

/**
 * Parse le HTML pour extraire les informations des chapitres.
 * Reprend la logique du frontend pour assurer la cohérence.
 */
function parseMangaChapters(htmlContent) {
  const chapters = [];
  try {
    const sortiePattern = /<div class="sortie">\s*<a href='([^']+)'>\s*<figure>\s*<img[^>]+src="([^"]+)"[^>]+alt="([^"]+)"[^>]*>\s*<figcaption>\s*<p>([^<]+)<span>([^<]+)<\/span><\/p>\s*<\/figcaption>\s*<\/figure>\s*<div class="sortiefooter">\s*<h3>([^<]+)<\/h3>\s*<p>([^<]+)<\/p>\s*<h4>([^<]+)<\/h4>\s*<\/div>\s*<\/a>\s*<\/div>/gi;

    let match;
    let chapterCount = 0;
    const maxChapters = 20;
    const seenTitles = new Set();

    while ((match = sortiePattern.exec(htmlContent)) !== null && chapterCount < maxChapters) {
      const [ , scanLink, imageSrc, altText, mangaTitle, author, chapterNumber, chapterTitle, language ] = match;
      const fullTitle = `${mangaTitle} - Chapitre ${chapterNumber.replace('#', '')}`;
      if (!seenTitles.has(fullTitle.toLowerCase())) {
        seenTitles.add(fullTitle.toLowerCase());
        chapters.push({
          id: `chapter-${chapterCount}`,
          title: fullTitle,
          manga: mangaTitle,
          chapter: chapterNumber.replace('#', ''),
          subtitle: chapterTitle,
          author,
          language,
          image: imageSrc.startsWith('http') ? imageSrc : `${MANGA_SITE_URL}${imageSrc.replace('./', '')}`,
          link: `${MANGA_SITE_URL}${scanLink}`,
          date: new Date().toLocaleDateString('fr-FR'),
          source: 'mangamoins.shaeishu.co',
        });
        chapterCount++;
      }
    }
  } catch (err) {
    console.error('Parse error:', err);
  }

  return chapters;
}

// Get latest chapters from mangamoins.shaeishu.co
router.get('/latest', async (req, res) => {
  try {
    const response = await axios.get(MANGA_SITE_URL, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'User-Agent': 'Mozilla/5.0',
      },
      timeout: 15000,
    });
    const chapters = parseMangaChapters(response.data || '');
    res.json(chapters);
  } catch (err) {
    console.error('Scraping failed:', err.message);
    res.status(500).json({ message: 'Scraping failed' });
  }
});

module.exports = router;
