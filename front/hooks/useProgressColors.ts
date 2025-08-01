import { useMemo } from 'react';
import { getProgressColors, getProgressWidth } from '@/utils/progressColors';

interface UseProgressColorsProps {
  lastRead: number;
  lastChapterComick: number;
}

interface ProgressData {
  progressWidth: number;
  progressColors: {
    progressColor: string;
    badgeColor: string;
    textColor: string;
  };
  progressText: string;
}

export function useProgressColors({ lastRead, lastChapterComick }: UseProgressColorsProps): ProgressData {
  return useMemo(() => {
    if (!lastChapterComick || lastChapterComick === 0) {
      return {
        progressWidth: 0,
        progressColors: {
          progressColor: '#6b7280',
          badgeColor: '#6b7280',
          textColor: '#6b7280'
        },
        progressText: '0 / 0'
      };
    }

    const progressPercent = lastRead / lastChapterComick;
    const progressColors = getProgressColors(progressPercent);
    const progressWidth = getProgressWidth(progressPercent);
    
    let progressText = '';
    if (lastRead === 0) {
      progressText = `0 / ${lastChapterComick}`;
    } else if (lastRead >= lastChapterComick) {
      progressText = `À jour (${lastChapterComick})`;
    } else {
      const remaining = lastChapterComick - lastRead;
      progressText = `${lastRead} / ${lastChapterComick} (-${remaining})`;
    }

    return {
      progressWidth,
      progressColors,
      progressText
    };
  }, [lastRead, lastChapterComick]);
} 
