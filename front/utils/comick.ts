import axios from 'axios';

/** Return last chapter number from Comick for a given title */
export async function getLastChapter(title: string): Promise<string | null> {
  try {
    const res = await axios.get('https://api.comick.io/v1.0/search', {
      params: { q: title, limit: 1 },
    });
    return res.data?.[0]?.last_chapter || null;
  } catch {
    return null;
  }
}
