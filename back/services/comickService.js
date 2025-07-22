const axios = require("axios");

async function getLatestChapters() {
  const resp = await axios.get("https://comick.io/api/latest", {
    params: { limit: 20 },
  });
  return resp.data;
}

// Récupère les chapitres d'un manga par son slug
async function getChaptersBySlug(slug) {
  const resp = await axios.get(`https://api.comick.io/v1.0/manga/${slug}/chapters`);
  const chapters = resp.data?.chapters || [];
  
  const sorted = chapters.filter(c => c.chap).sort((a, b) => parseFloat(b.chap) - parseFloat(a.chap));
  const latest = sorted[0] || null;
  return resp.data;
}

module.exports = { getLatestChapters, getChaptersBySlug };
