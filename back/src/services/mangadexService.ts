import axios from 'axios';

const BASE = process.env.MANGADEX_BASE || 'https://api.mangadex.org';

export const searchManga = async (q: string) => {
  if (BASE === 'mock') {
    return (await import('../mocks/manga.json')).default;
  }
  const url = `${BASE}/manga?title=${encodeURIComponent(q)}&limit=5`;
  const { data } = await axios.get(url);
  return data;
};

export const getMangaChapters = async (id: string) => {
  if (BASE === 'mock') {
    return { data: [] };
  }
  const url = `${BASE}/manga/${id}/feed?limit=30&translatedLanguage[]=en`;
  const { data } = await axios.get(url);
  return data;
};
