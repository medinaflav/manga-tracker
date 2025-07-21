const axios = require("axios");

async function searchMangas(q) {
  const resp = await axios.get("https://api.mangadex.org/manga", {
    params: { title: q, limit: 10 },
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

module.exports = { searchMangas, getChapterPages, getLatestChapters, getMangaCoverUrl };
