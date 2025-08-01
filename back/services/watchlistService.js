const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const watchlistSchema = new mongoose.Schema({
  username: { type: String, required: true, index: true },
  mangaId: { type: String, required: true },
  title: { type: String, required: true },
  lastRead: { type: String, default: null },
}, { timestamps: true });

watchlistSchema.index({ username: 1, mangaId: 1 }, { unique: true });
const Watchlist = mongoose.model("Watchlist", watchlistSchema);

function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.user = payload.username;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

async function addToWatchlist(username, mangaId, title, lastRead) {
  await Watchlist.findOneAndUpdate(
    { username, mangaId },
    { $set: { title, lastRead: lastRead || null } },
    { upsert: true, new: true }
  );
}

async function removeFromWatchlist(username, mangaId) {
  await Watchlist.deleteOne({ username, mangaId });
}

async function updateLastRead(username, mangaId, lastRead) {
  await Watchlist.findOneAndUpdate(
    { username, mangaId },
    { $set: { lastRead } },
    { new: true }
  );
}

async function updateLastChapterComick(username, mangaId, lastChapterComick) {
  await Watchlist.findOneAndUpdate(
    { username, mangaId },
    { $set: { lastChapterComick } },
    { new: true }
  );
}

async function getWatchlist(username) {
  return await Watchlist.find({ username });
}

module.exports = {
  auth,
  addToWatchlist,
  removeFromWatchlist,
  updateLastRead,
  getWatchlist,
  updateLastChapterComick,
};
