const axios = require("axios");
const mongoose = require("mongoose");

const mangaSchema = new mongoose.Schema({
  mangadexId: { type: String, required: true, unique: true }, // ID MangaDex
  slug: { type: String, required: true, unique: true }, // Slug du manga
  title: { type: String, required: true }, // Titre du manga
  author: { type: String, default: null }, // Auteur
  coverUrl: { type: String, default: null }, // URL de la couverture
  description: { type: String, default: null }, // Description
  lastChapter: { type: String, default: null }, // Dernier chapitre disponible
}, { timestamps: true });

const Manga = mongoose.models.Manga || mongoose.model("Manga", mangaSchema);

async function searchMangas(q) {
  const resp = await axios.get("https://api.mangadex.org/manga", {
    params: { title: q, limit: 10, includes: ["cover_art"] },
  });
  return resp.data;
}

async function getChapterPages(id) {
  const url = `https://api.mangadex.org/at-home/server/${id}`;
  const resp = await axios.get(url);
  return resp.data;
}

async function getLatestChapters() {
  const resp = await axios.get("https://api.mangadex.org/chapter", {
    params: { limit: 100, "order[readableAt]": "desc" },
  });
  return resp.data;
}

async function getMangaCoverUrl(mangaTitle) {
  if (!mangaTitle || mangaTitle === 'Manga' || mangaTitle === 'Auteur inconnu') {
    return null;
  }
  try {
    // 1. Chercher l'ID du manga par titre
    const mangaRes = await axios.get(
      `https://api.mangadex.org/manga?title=${encodeURIComponent(mangaTitle)}`
    );
    const mangaData = mangaRes.data?.data;
    if (!mangaData || mangaData.length === 0) {
      return null;
    }
    const mangaId = mangaData[0].id;

    // 2. Récupérer la couverture liée
    const coverRes = await axios.get(
      `https://api.mangadex.org/cover?manga[]=${mangaId}`
    );
    const coverData = coverRes.data?.data;
    if (!coverData || coverData.length === 0) {
      return null;
    }
    const fileName = coverData[0].attributes.fileName;

    // 3. Construire l'URL finale
    const coverUrl = `https://uploads.mangadex.org/covers/${mangaId}/${fileName}`;
    return coverUrl;
  } catch (error) {
    return null;
  }
}

async function findOrCreateManga(mangadexId, slug, title, author = null, coverUrl = null, description = null) {
  try {
    // Essayer de trouver le manga par mangadexId
    let manga = await Manga.findOne({ mangadexId });
    
    if (!manga) {
      // Essayer de trouver par slug
      manga = await Manga.findOne({ slug });
    }
    
    if (!manga) {
      // Créer un nouveau manga
      manga = new Manga({
        mangadexId,
        slug,
        title,
        author,
        coverUrl,
        description
      });
      await manga.save();
      console.log(`[MANGA-SERVICE] Created new manga: ${title} (${slug})`);
    } else {
      // Mettre à jour les informations si nécessaire
      const updated = await Manga.findOneAndUpdate(
        { _id: manga._id },
        { 
          $set: { 
            mangadexId, 
            slug, 
            title, 
            author: author || manga.author,
            coverUrl: coverUrl || manga.coverUrl,
            description: description || manga.description
          } 
        },
        { new: true }
      );
      manga = updated;
      console.log(`[MANGA-SERVICE] Updated manga: ${title} (${slug})`);
    }
    
    return manga;
  } catch (error) {
    console.error('[MANGA-SERVICE] Error in findOrCreateManga:', error);
    throw error;
  }
}

async function getMangaById(id) {
  return await Manga.findById(id);
}

async function getMangaByMangadexId(mangadexId) {
  return await Manga.findOne({ mangadexId });
}

async function getMangaBySlug(slug) {
  return await Manga.findOne({ slug });
}

async function updateLastChapter(mangadexId, lastChapter) {
  try {
    const result = await Manga.findOneAndUpdate(
      { mangadexId },
      { $set: { lastChapter } },
      { new: true }
    );
    
    if (result) {
      console.log(`[MANGA-SERVICE] Updated lastChapter for ${mangadexId}: ${lastChapter}`);
    } else {
      console.log(`[MANGA-SERVICE] Manga not found for mangadexId: ${mangadexId}`);
    }
    
    return result;
  } catch (error) {
    console.error('[MANGA-SERVICE] Error updating lastChapter:', error);
    throw error;
  }
}

module.exports = { 
  searchMangas, 
  getChapterPages, 
  getLatestChapters, 
  getMangaCoverUrl,
  Manga,
  findOrCreateManga,
  getMangaById,
  getMangaByMangadexId,
  getMangaBySlug,
  updateLastChapter
};
