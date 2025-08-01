import { useState, useCallback } from 'react';
import { api } from '@/utils/api';

interface ChapterDetectionResult {
  chapter: string;
  source: 'comick' | 'mangamoins';
  comickChapter: string | null;
  mangamoinsChapter: string | null;
}

interface UseChapterDetectionReturn {
  detectChapters: (mangadexId: string, title: string) => Promise<ChapterDetectionResult | null>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook pour détecter les derniers chapitres d'un manga
 */
export function useChapterDetection(): UseChapterDetectionReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectChapters = useCallback(async (mangadexId: string, title: string): Promise<ChapterDetectionResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/api/manga/${mangadexId}/detect-chapters`, {
        params: { title }
      });

      if (response.data.success) {
        return {
          chapter: response.data.latestChapter,
          source: response.data.source,
          comickChapter: response.data.comickChapter,
          mangamoinsChapter: response.data.mangamoinsChapter
        };
      } else {
        setError(response.data.message || 'Aucun chapitre trouvé');
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Erreur de détection';
      setError(errorMessage);
      console.error('[CHAPTER-DETECTION] Detection failed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    detectChapters,
    loading,
    error
  };
} 