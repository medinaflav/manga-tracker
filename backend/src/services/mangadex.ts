import axios from 'axios';

const API_BASE = 'https://api.mangadex.org';

export const searchManga = async (q: string) => {
  const res = await axios.get(`${API_BASE}/manga`, {
    params: { title: q, limit: 10 }
  });
  return res.data.data.map((m: any) => ({
    id: m.id,
    title: m.attributes.title.en || Object.values(m.attributes.title)[0],
    coverUrl: m.relationships.find((r: any) => r.type === 'cover_art')?.attributes?.fileName
      ? `https://uploads.mangadex.org/covers/${m.id}/${m.relationships.find((r: any) => r.type === 'cover_art').attributes.fileName}.256.jpg`
      : null
  }));
};

export const getMangaChapters = async (mangaId: string) => {
  const res = await axios.get(`${API_BASE}/chapter`, {
    params: { manga: mangaId, translatedLanguage: ['en', 'ja'], order: { chapter: 'asc' } }
  });
  return res.data.data.map((c: any) => ({
    id: c.id,
    chapter: Number(c.attributes.chapter),
    title: c.attributes.title,
    publishedAt: c.attributes.publishAt
  }));
};

export const getLatestChapter = async (mangaId: string) => {
  const res = await axios.get(`${API_BASE}/chapter`, {
    params: { manga: mangaId, limit: 1, order: { chapter: 'desc' } }
  });
  const c = res.data.data[0];
  return c ? Number(c.attributes.chapter) : 0;
};

export const getLatestReleases = async () => {
  const res = await axios.get(`${API_BASE}/chapter`, {
    params: { order: { publishedAt: 'desc' }, limit: 10 }
  });
  return res.data.data.map((c: any) => ({
    id: c.id,
    mangaId: c.relationships.find((r: any) => r.type === 'manga')?.id,
    chapter: Number(c.attributes.chapter),
    title: c.attributes.title
  }));
};

export const getManga = async (id: string) => {
  const res = await axios.get(`${API_BASE}/manga/${id}`);
  const m = res.data.data;
  const cover = m.relationships.find((r: any) => r.type === 'cover_art')?.attributes?.fileName;
  return {
    id: m.id,
    title: m.attributes.title.en || Object.values(m.attributes.title)[0],
    coverUrl: cover ? `https://uploads.mangadex.org/covers/${m.id}/${cover}.256.jpg` : null
  };
};
