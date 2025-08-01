const mongoose = require("mongoose");
const { getMangaByMangadexId, getMangaBySlug, findOrCreateManga } = require("./mangaService");
const { User } = require("./authService");
const { addToWatchlist, updateLastRead } = require("./watchlistService");

const readingProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Référence vers le modèle User
  mangaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manga', required: true }, // Référence vers le modèle Manga
  chapter: { type: Number, required: true }, // Numéro du chapitre (ex: 1156)
  page: { type: Number, default: null },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const ReadingProgress = mongoose.models.ReadingProgress || mongoose.model("ReadingProgress", readingProgressSchema);

async function saveProgress(username, mangadexId, mangaTitle, chapterId, page) {
  try {
    // Trouver l'utilisateur par username pour obtenir son ID
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error(`User not found: ${username}`);
    }
    
    // Extraire le numéro du chapitre (ex: "OP1156" -> 1156)
    const chapterNumber = parseInt(chapterId.replace(/[^0-9]/g, ''));
    
    // Ajouter le manga à la watchlist s'il n'existe pas déjà
    let manga = await getMangaByMangadexId(mangadexId);
    if (!manga) {
      // Créer le manga et l'ajouter à la watchlist
      const slug = mangaTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      manga = await findOrCreateManga(mangadexId, slug, mangaTitle, null, null, null);
      await addToWatchlist(username, mangadexId, mangaTitle, chapterNumber.toString());
      console.log(`[READING-PROGRESS-SERVICE] Added manga to watchlist: ${mangaTitle} (${manga._id})`);
    } else {
      // Mettre à jour la progression dans la watchlist
      await updateLastRead(username, mangadexId, chapterNumber.toString());
      console.log(`[READING-PROGRESS-SERVICE] Updated watchlist progress: ${manga.title} (${manga._id}) chapter ${chapterNumber}`);
    }
    
    // Sauvegarder la progression de lecture
    await ReadingProgress.findOneAndUpdate(
      { userId: user._id, mangaId: manga._id },
      { $set: { chapter: chapterNumber, page, updatedAt: new Date() } },
      { upsert: true, new: true }
    );
    
    console.log(`[READING-PROGRESS-SERVICE] Saved progress for manga: ${manga.title} (${manga._id}) chapter ${chapterNumber} page ${page} for user: ${user._id}`);
  } catch (error) {
    console.error('[READING-PROGRESS-SERVICE] Error saving progress:', error);
    throw error;
  }
}

async function getProgressForUser(username) {
  try {
    // Trouver l'utilisateur par username pour obtenir son ID
    let user = await User.findOne({ username });
    if (!user) {
      console.log(`[READING-PROGRESS-SERVICE] User not found: ${username}, creating...`);
      // Créer l'utilisateur s'il n'existe pas (pour les tests)
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash("password123", 10);
      user = new User({ username, password: hashedPassword });
      await user.save();
      console.log(`[READING-PROGRESS-SERVICE] Created user: ${username} with ID: ${user._id}`);
    }
    
    const progress = await ReadingProgress.find({ userId: user._id }).populate('mangaId').sort({ updatedAt: -1 }).lean();
    return progress.map(item => ({
      ...item,
      mangaId: item.mangaId.mangadexId, // Retourner l'ID MangaDex pour compatibilité
      mangaTitle: item.mangaId.title,
      slug: item.mangaId.slug,
      chapter: item.chapter // Numéro du chapitre
    }));
  } catch (error) {
    console.error('[READING-PROGRESS-SERVICE] Error getting progress:', error);
    throw error;
  }
}

async function deleteProgressForManga(username, mangadexId) {
  try {
    // Trouver l'utilisateur par username pour obtenir son ID
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error(`User not found: ${username}`);
    }
    
    // Trouver le manga par mangadexId
    const manga = await getMangaByMangadexId(mangadexId);
    if (!manga) {
      console.log(`[READING-PROGRESS-SERVICE] Manga not found for mangadexId: ${mangadexId}`);
      return { deletedCount: 0 };
    }
    
    // Supprimer la progression de lecture pour ce manga
    const result = await ReadingProgress.deleteOne({ userId: user._id, mangaId: manga._id });
    
    if (result.deletedCount > 0) {
      console.log(`[READING-PROGRESS-SERVICE] Deleted progress for manga: ${manga.title} (${manga._id}) for user: ${user._id}`);
    } else {
      console.log(`[READING-PROGRESS-SERVICE] No progress found for manga: ${manga.title} (${manga._id}) for user: ${user._id}`);
    }
    
    return result;
  } catch (error) {
    console.error('[READING-PROGRESS-SERVICE] Error deleting progress:', error);
    throw error;
  }
}

async function deleteProgressForMangaByTitle(username, mangaTitle) {
  const user = await User.findOne({ username });
  if (!user) {
    throw new Error(`User not found: ${username}`);
  }
  
  // Trouver le manga par titre
  const manga = await getMangaBySlug(mangaTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
  if (!manga) {
    console.log(`[READING-PROGRESS-SERVICE] Manga not found for title: ${mangaTitle}`);
    return { deletedCount: 0 };
  }
  
  return await ReadingProgress.deleteOne({ userId: user._id, mangaId: manga._id });
}

async function cleanupOrphanedProgress() {
  try {
    // Trouver tous les enregistrements de progression avec des références mangaId invalides
    const orphanedProgress = await ReadingProgress.find({}).populate('mangaId');
    const toDelete = orphanedProgress.filter(item => item.mangaId === null);
    
    if (toDelete.length > 0) {
      console.log(`[READING-PROGRESS-SERVICE] Found ${toDelete.length} orphaned progress records, cleaning up...`);
      const idsToDelete = toDelete.map(item => item._id);
      const result = await ReadingProgress.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`[READING-PROGRESS-SERVICE] Cleaned up ${result.deletedCount} orphaned records`);
    }
    
    // Nettoyer aussi les enregistrements avec des références userId invalides
    const orphanedUserProgress = await ReadingProgress.find({}).populate('userId');
    const toDeleteUser = orphanedUserProgress.filter(item => item.userId === null);
    
    if (toDeleteUser.length > 0) {
      console.log(`[READING-PROGRESS-SERVICE] Found ${toDeleteUser.length} orphaned user progress records, cleaning up...`);
      const idsToDeleteUser = toDeleteUser.map(item => item._id);
      const resultUser = await ReadingProgress.deleteMany({ _id: { $in: idsToDeleteUser } });
      console.log(`[READING-PROGRESS-SERVICE] Cleaned up ${resultUser.deletedCount} orphaned user records`);
    }
  } catch (error) {
    console.error('[READING-PROGRESS-SERVICE] Error cleaning up orphaned progress:', error);
  }
}

module.exports = { saveProgress, getProgressForUser, deleteProgressForManga, deleteProgressForMangaByTitle, cleanupOrphanedProgress }; 