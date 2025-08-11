import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export function useProgressColors() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getProgressColors = (progressPercent: number, lastRead: number, totalChapters: number) => {
    if (lastRead === 0) {
      return {
        progressColor: colors.progressNotStarted,
        badgeColor: colors.progressNotStarted,
        textColor: colors.progressNotStarted,
      };
    }

    if (progressPercent >= 1.0) {
      return {
        progressColor: colors.progressCompleted,
        badgeColor: colors.progressCompleted,
        textColor: colors.progressCompleted,
      };
    }

    if (progressPercent >= 0.7) {
      return {
        progressColor: colors.progressAlmostDone,
        badgeColor: colors.progressAlmostDone,
        textColor: colors.progressAlmostDone,
      };
    }

    if (progressPercent >= 0.4) {
      return {
        progressColor: colors.progressInProgress,
        badgeColor: colors.progressInProgress,
        textColor: colors.progressInProgress,
      };
    }

    return {
      progressColor: colors.progressNotStarted,
      badgeColor: colors.progressNotStarted,
      textColor: colors.progressNotStarted,
    };
  };

  return {
    colors,
    getProgressColors,
  };
} 