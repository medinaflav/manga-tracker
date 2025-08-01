import axios from 'axios';
import { api } from './api';

export interface MangaDetails {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  totalChapters: number | null;
}

/** Fetch detailed info for a MangaDex manga by id */
export async function getMangaDetailsById(id: string): Promise<MangaDetails | null> {
  try {
    const res = await api.get(`/api/manga/mangadex/${id}`);
    const manga = res.data.data;
    const coverRel = manga?.relationships?.find((r: any) => r.type === 'cover_art');
    const coverUrl = coverRel?.attributes?.fileName
      ? `https://uploads.mangadex.org/covers/${id}/${coverRel.attributes.fileName}.256.jpg`
      : null;
    const authorRel = manga?.relationships?.find((r: any) => r.type === 'author');
    const author = authorRel?.attributes?.name || 'Auteur inconnu';
    let totalChapters: number | null = null;
    try {
      const chaptersRes = await api.get(`/api/manga/mangadex/${id}/chapters`);
      totalChapters = chaptersRes.data.totalChapters;
    } catch {}
    return {
      id,
      title: manga.attributes?.title?.en || Object.values(manga.attributes?.title || {})[0] || 'Sans titre',
      author,
      coverUrl,
      totalChapters,
    };
  } catch {
    return null;
  }
}

/** Fetch manga info by title (exact or startsWith) */
export async function searchMangaByTitle(title: string) {
  try {
    const res = await axios.get('https://api.mangadex.org/manga', {
      params: { title, limit: 10, includes: ['cover_art'] },
    });
    const mangas = res.data.data;
    if (!mangas || mangas.length === 0) return null;
    const exact = mangas.find((m: any) => {
      const enTitle = m.attributes.title.en || Object.values(m.attributes.title)[0];
      return enTitle?.toLowerCase() === title.toLowerCase();
    });
    const startsWith =
      !exact &&
      mangas.find((m: any) => {
        const enTitle = m.attributes.title.en || Object.values(m.attributes.title)[0];
        return enTitle?.toLowerCase().startsWith(title.toLowerCase());
      });
    const manga = exact || startsWith || mangas[0];
    const coverFileName = manga?.relationships?.find((r: any) => r.type === 'cover_art')?.attributes?.fileName;
    const coverUrl = coverFileName
      ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFileName}.256.jpg`
      : null;
    return {
      id: manga.id,
      title: manga.attributes.title.en || Object.values(manga.attributes.title)[0],
      author: manga.attributes.author || '',
      description: manga.attributes.description.en || '',
      coverUrl,
    };
  } catch {
    return null;
  }
}
