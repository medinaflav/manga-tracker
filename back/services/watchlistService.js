const jwt = require("jsonwebtoken");

const watchlists = {};
const progress = {};

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

function addToWatchlist(username, mangaId, title) {
  watchlists[username] = watchlists[username] || [];
  if (!watchlists[username].find((m) => m.mangaId === mangaId)) {
    watchlists[username].push({ mangaId, title });
  }
}

function getWatchlist(username) {
  return watchlists[username] || [];
}

function updateProgress(username, mangaId, chapterId, read) {
  progress[username] = progress[username] || {};
  progress[username][mangaId] = progress[username][mangaId] || {};
  progress[username][mangaId][chapterId] = !!read;
}

function getProgress(username, mangaId) {
  return progress[username]?.[mangaId] || {};
}

module.exports = {
  auth,
  addToWatchlist,
  getWatchlist,
  updateProgress,
  getProgress,
};
