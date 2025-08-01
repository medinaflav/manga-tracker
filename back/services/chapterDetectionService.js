const axios = require("axios");
const { updateLastChapter } = require("./mangaService");

/**
 * Service pour détecter et mettre à jour les derniers chapitres
 * en comparant Comick et MangaMoins
 */
class ChapterDetectionService {
  
  /**
   * Récupère le dernier chapitre depuis Comick
   */
  async getComickLatestChapter(mangaTitle) {
    try {
      const res = await axios.get('https://api.comick.io/v1.0/search', {
        params: { q: mangaTitle, limit: 1 },
      });
      return res.data?.[0]?.last_chapter || null;
    } catch (error) {
      console.error('[CHAPTER-DETECTION] Comick search failed:', error.message);
      return null;
    }
  }

  /**
   * Récupère les chapitres depuis MangaMoins
   */
  async getMangaMoinsChapters(mangaTitle) {
    try {
      const { data } = await axios.get('http://localhost:3000/api/mangamoins/latest');
      
      // Debug: afficher tous les mangas disponibles
      console.log(`[CHAPTER-DETECTION] Available mangas in MangaMoins:`, data.map(ch => ch.manga));
      
      // Filtrer les chapitres qui correspondent au manga
      const matchingChapters = data.filter((chapter) => 
        chapter.manga.toLowerCase() === mangaTitle.toLowerCase() ||
        chapter.manga.toLowerCase().includes(mangaTitle.toLowerCase()) ||
        mangaTitle.toLowerCase().includes(chapter.manga.toLowerCase())
      );
      
      console.log(`[CHAPTER-DETECTION] Found ${matchingChapters.length} matching chapters for "${mangaTitle}":`, matchingChapters.map(ch => `${ch.manga} - Ch. ${ch.chapter}`));
      
      return matchingChapters;
    } catch (error) {
      console.error('[CHAPTER-DETECTION] MangaMoins search failed:', error.message);
      return [];
    }
  }

  /**
   * Trouve le chapitre le plus récent de MangaMoins
   */
  async getMangaMoinsLatestChapter(mangaTitle) {
    const chapters = await this.getMangaMoinsChapters(mangaTitle);
    
    if (chapters.length === 0) {
      return null;
    }
    
    // Trouver le chapitre le plus récent
    const latestChapter = chapters.reduce((latest, current) => {
      const latestNum = parseFloat(latest.chapter);
      const currentNum = parseFloat(current.chapter);
      return !isNaN(currentNum) && (isNaN(latestNum) || currentNum > latestNum) ? current : latest;
    });
    
    return latestChapter.chapter;
  }

  /**
   * Compare et retourne le chapitre le plus récent
   */
  async getLatestChapter(mangaTitle) {
    console.log(`[CHAPTER-DETECTION] Checking latest chapter for: ${mangaTitle}`);
    
    // Récupérer les chapitres des deux sources
    const [comickChapter, mangamoinsChapter] = await Promise.all([
      this.getComickLatestChapter(mangaTitle),
      this.getMangaMoinsLatestChapter(mangaTitle)
    ]);
    
    console.log(`[CHAPTER-DETECTION] Comick: ${comickChapter}, MangaMoins: ${mangamoinsChapter}`);
    
    // Comparer les chapitres
    const comickNum = comickChapter ? parseFloat(comickChapter) : 0;
    const mangamoinsNum = mangamoinsChapter ? parseFloat(mangamoinsChapter) : 0;
    
    let latestChapter = comickChapter;
    let source = 'comick';
    
    if (mangamoinsNum > comickNum) {
      latestChapter = mangamoinsChapter;
      source = 'mangamoins';
      console.log(`[CHAPTER-DETECTION] Using MangaMoins chapter ${mangamoinsChapter} instead of Comick ${comickChapter}`);
    }
    
    // Si aucun chapitre n'est trouvé, essayer de récupérer depuis MangaDex
    if (!latestChapter) {
      console.log(`[CHAPTER-DETECTION] No chapters found from sources, trying MangaDex for ${mangaTitle}`);
      try {
        const axios = require('axios');
        const response = await axios.get(`https://api.mangadex.org/manga?title=${encodeURIComponent(mangaTitle)}`);
        const mangaData = response.data?.data;
        if (mangaData && mangaData.length > 0) {
          const mangaId = mangaData[0].id;
          const chaptersResponse = await axios.get(`https://api.mangadex.org/chapter?manga=${mangaId}&limit=1&order[chapter]=desc`);
          const chapters = chaptersResponse.data?.data;
          if (chapters && chapters.length > 0) {
            const chapterNumber = chapters[0].attributes?.chapter;
            if (chapterNumber) {
              latestChapter = chapterNumber;
              source = 'mangadex';
              console.log(`[CHAPTER-DETECTION] Found ${latestChapter} chapters from MangaDex for ${mangaTitle}`);
            }
          }
        }
      } catch (error) {
        console.log(`[CHAPTER-DETECTION] MangaDex search failed for ${mangaTitle}: ${error.message}`);
      }
    }
    
    // Si toujours rien trouvé, utiliser une valeur par défaut
    if (!latestChapter) {
      console.log(`[CHAPTER-DETECTION] No chapters found for ${mangaTitle}, using default value`);
      latestChapter = "1"; // Chapitre par défaut
      source = 'default';
    }
    
    return {
      chapter: latestChapter,
      source,
      comickChapter,
      mangamoinsChapter
    };
  }

  /**
   * Met à jour le lastChapter en base de données si nécessaire
   */
  async updateDatabaseIfNewer(mangadexId, mangaTitle, latestChapter) {
    if (!latestChapter || !mangadexId) {
      return false;
    }
    
    try {
      const result = await updateLastChapter(mangadexId, latestChapter);
      if (result) {
        console.log(`[CHAPTER-DETECTION] Updated lastChapter in database for ${mangaTitle}: ${latestChapter}`);
        return true;
      }
    } catch (error) {
      console.error('[CHAPTER-DETECTION] Database update failed:', error.message);
    }
    
    return false;
  }

  /**
   * Service complet : détecte et met à jour automatiquement
   */
  async detectAndUpdate(mangadexId, mangaTitle) {
    try {
      const result = await this.getLatestChapter(mangaTitle);
      
      if (result.chapter) {
        // Mettre à jour la base de données si c'est un chapitre MangaMoins plus récent
        if (result.source === 'mangamoins' && result.mangamoinsChapter > result.comickChapter) {
          await this.updateDatabaseIfNewer(mangadexId, mangaTitle, result.chapter);
        }
        
        return result;
      }
      
      return null;
    } catch (error) {
      console.error('[CHAPTER-DETECTION] Detection failed:', error.message);
      return null;
    }
  }
}

module.exports = new ChapterDetectionService(); 