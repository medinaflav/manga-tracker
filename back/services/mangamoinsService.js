const axios = require("axios");

const MANGA_SITE_URL = "https://mangamoins.shaeishu.co/";

function parseMangaChapters(htmlContent) {
  const chapters = [];
  try {
    const sortiePattern =
      /<div class="sortie">\s*<a href='([^']+)'>\s*<figure>\s*<img[^>]+src="([^"]+)"[^>]*>\s*<figcaption>\s*<p>([^<]+)<span>([^<]+)<\/span><\/p>\s*<\/figcaption>\s*<\/figure>\s*<div class="sortiefooter">\s*<h3>([^<]+)<\/h3>\s*<p>([^<]+)<\/p>\s*<h4>([^<]+)<\/h4>\s*<\/div>\s*<\/a>\s*<\/div>/gi;
    let match;
    let chapterCount = 0;
    const maxChapters = 20;
    const seenTitles = new Set();
    while (
      (match = sortiePattern.exec(htmlContent)) !== null &&
      chapterCount < maxChapters
    ) {
      const [
        ,
        scanLink,
        imageSrc,
        mangaTitle,
        author,
        chapterNumber,
        chapterTitle,
        language,
      ] = match;
      const fullTitle = `${mangaTitle} - Chapitre ${chapterNumber.replace("#", "")}`;
      if (!seenTitles.has(fullTitle.toLowerCase())) {
        seenTitles.add(fullTitle.toLowerCase());
        chapters.push({
          id: `chapter-${chapterCount}`,
          title: fullTitle,
          manga: mangaTitle,
          chapter: chapterNumber.replace("#", ""),
          subtitle: chapterTitle,
          author,
          language,
          image: imageSrc.startsWith("http")
            ? imageSrc
            : `${MANGA_SITE_URL}${imageSrc.replace("./", "")}`,
          link: `${MANGA_SITE_URL}${scanLink}`,
          date: new Date().toLocaleDateString("fr-FR"),
          source: "mangamoins.shaeishu.co",
        });
        chapterCount++;
      }
    }
  } catch (err) {
    console.error("Parse error:", err);
  }
  return chapters;
}

async function getLatestChapters() {
  // 1. Scraping direct
  try {
    const response = await axios.get(MANGA_SITE_URL, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/117.0',
        'Referer': MANGA_SITE_URL,
      },
      timeout: 15000,
    });
    return parseMangaChapters(response.data || '');
  } catch (err) {
    // Si 403 ou autre, fallback sur les proxies
    const proxies = [
      {
        url: `https://api.allorigins.win/get?url=${encodeURIComponent(MANGA_SITE_URL)}`,
        transform: (data) => data.contents || data,
      },
      {
        url: `https://corsproxy.io/?${encodeURIComponent(MANGA_SITE_URL)}`,
        transform: (data) => data,
      },
      {
        url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(MANGA_SITE_URL)}`,
        transform: (data) => data,
      },
    ];
    for (const proxy of proxies) {
      try {
        const resp = await axios.get(proxy.url, { timeout: 15000 });
        const htmlContent = proxy.transform(resp.data);
        if (htmlContent && typeof htmlContent === 'string' && htmlContent.length > 1000) {
          const chapters = parseMangaChapters(htmlContent);
          if (chapters.length > 0) return chapters;
        }
      } catch (proxyErr) {
        continue;
      }
    }
    // Si tout échoue
    return [];
  }
}

module.exports = { getLatestChapters };
