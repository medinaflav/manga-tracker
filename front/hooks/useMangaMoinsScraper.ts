import axios from 'axios';

const MANGA_SITE_URL = 'https://mangamoins.shaeishu.co/';

function parseMangaChapters(htmlContent: string) {
  const chapters: any[] = [];
  try {
    const sortiePattern = /<div class="sortie">\s*<a href='([^']+)'>\s*<figure>\s*<img[^>]+src="([^"]+)"[^>]*>\s*<figcaption>\s*<p>([^<]+)<span>([^<]+)<\/span><\/p>\s*<\/figcaption>\s*<\/figure>\s*<div class="sortiefooter">\s*<h3>([^<]+)<\/h3>\s*<p>([^<]+)<\/p>\s*<h4>([^<]+)<\/h4>\s*<\/div>\s*<\/a>\s*<\/div>/gi;
    let match;
    let chapterCount = 0;
    const maxChapters = 20;
    const seenTitles = new Set<string>();
    while ((match = sortiePattern.exec(htmlContent)) !== null && chapterCount < maxChapters) {
      const [ , scanLink, imageSrc, mangaTitle, author, chapterNumber, chapterTitle, language ] = match;
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
    // Optionnel : log
  }
  return chapters;
}

export async function scrapeMangaMoinsLatest(): Promise<any[]> {
  const proxies = [
    {
      url: `https://api.allorigins.win/get?url=${encodeURIComponent(MANGA_SITE_URL)}`,
      transform: (data: any) => data.contents || data,
    },
    {
      url: `https://corsproxy.io/?${encodeURIComponent(MANGA_SITE_URL)}`,
      transform: (data: any) => data,
    },
    {
      url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(MANGA_SITE_URL)}`,
      transform: (data: any) => data,
    },
  ];
  for (const proxy of proxies) {
    try {
      const response = await axios.get(proxy.url, { timeout: 15000 });
      const htmlContent = proxy.transform(response.data);
      if (htmlContent && typeof htmlContent === 'string' && htmlContent.length > 1000) {
        const chapters = parseMangaChapters(htmlContent);
        if (chapters.length > 0) return chapters;
      }
    } catch (err) {
      continue;
    }
  }
  return [];
} 
