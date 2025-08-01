const mongoose = require("mongoose");
const { findOrCreateManga, getMangaById } = require("./mangaService");

const watchlistSchema = new mongoose.Schema({
  username: { type: String, required: true, index: true },
  mangaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manga', required: true }, // Référence vers le modèle Manga
  lastRead: { type: String, default: null },
  lastChapterComick: { type: String, default: null },
}, { timestamps: true });

watchlistSchema.index({ username: 1, mangaId: 1 }, { unique: true });
const Watchlist = mongoose.model("Watchlist", watchlistSchema);


async function addToWatchlist(username, mangadexId, title, lastRead, author = null, coverUrl = null, description = null) {
  try {
    // Créer ou récupérer le manga en base
    const manga = await findOrCreateManga(mangadexId, mangadexId, title, author, coverUrl, description);
    
    // Ajouter à la watchlist avec l'ID de la base
    await Watchlist.findOneAndUpdate(
      { username, mangaId: manga._id },
      { $set: { lastRead: lastRead || null } },
      { upsert: true, new: true }
    );
    
    console.log(`[WATCHLIST-SERVICE] Added manga to watchlist: ${title} (${manga._id})`);
    return manga._id;
  } catch (error) {
    console.error('[WATCHLIST-SERVICE] Error adding to watchlist:', error);
    throw error;
  }
}

async function removeFromWatchlist(username, mangadexId) {
  try {
    // Trouver le manga par mangadexId
    const { getMangaByMangadexId } = require("./mangaService");
    const manga = await getMangaByMangadexId(mangadexId);
    
    if (manga) {
      await Watchlist.deleteOne({ username, mangaId: manga._id });
      console.log(`[WATCHLIST-SERVICE] Removed manga from watchlist: ${manga.title} (${manga._id})`);
    } else {
      console.log(`[WATCHLIST-SERVICE] Manga not found for mangadexId: ${mangadexId}`);
    }
  } catch (error) {
    console.error('[WATCHLIST-SERVICE] Error removing from watchlist:', error);
    throw error;
  }
}

async function updateLastRead(username, mangadexId, lastRead) {
  try {
    const { getMangaByMangadexId } = require("./mangaService");
    const manga = await getMangaByMangadexId(mangadexId);
    
    if (manga) {
      await Watchlist.findOneAndUpdate(
        { username, mangaId: manga._id },
        { $set: { lastRead } },
        { new: true }
      );
    }
  } catch (error) {
    console.error('[WATCHLIST-SERVICE] Error updating lastRead:', error);
    throw error;
  }
}

async function updateLastChapterComick(username, mangadexId, lastChapterComick) {
  try {
    const { getMangaByMangadexId } = require("./mangaService");
    const manga = await getMangaByMangadexId(mangadexId);
    
    if (manga) {
      await Watchlist.findOneAndUpdate(
        { username, mangaId: manga._id },
        { $set: { lastChapterComick } },
        { new: true }
      );
    }
  } catch (error) {
    console.error('[WATCHLIST-SERVICE] Error updating lastChapterComick:', error);
    throw error;
  }
}

async function getWatchlist(username) {
  try {
    const watchlist = await Watchlist.find({ username }).populate('mangaId');
    
    // Filtrer les éléments avec mangaId null et les mapper
    const validItems = watchlist
      .filter(item => item.mangaId !== null) // Filtrer les éléments avec mangaId null
      .map(item => ({
        mangaId: item.mangaId.mangadexId, // Retourner l'ID MangaDex pour compatibilité
        title: item.mangaId.title,
        author: item.mangaId.author,
        coverUrl: item.mangaId.coverUrl,
        lastRead: item.lastRead,
        lastChapterComick: item.lastChapterComick,
        _id: item.mangaId._id, // ID de la base pour référence interne
        slug: item.mangaId.slug
      }));
    
    // Si des éléments ont été filtrés, les supprimer de la base
    const invalidItems = watchlist.filter(item => item.mangaId === null);
    if (invalidItems.length > 0) {
      console.log(`[WATCHLIST-SERVICE] Found ${invalidItems.length} invalid watchlist items, cleaning up...`);
      for (const item of invalidItems) {
        await Watchlist.deleteOne({ _id: item._id });
        console.log(`[WATCHLIST-SERVICE] Deleted invalid watchlist item: ${item._id}`);
      }
    }
    
    return validItems;
  } catch (error) {
    console.error('[WATCHLIST-SERVICE] Error getting watchlist:', error);
    throw error;
  }
}

module.exports = {
  addToWatchlist,
  removeFromWatchlist,
  updateLastRead,
  getWatchlist,
  updateLastChapterComick,
};
