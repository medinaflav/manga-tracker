/**
 * Service pour gérer les couleurs de progression
 */
export interface ProgressColors {
  progressColor: string;
  badgeColor: string;
  textColor: string;
}

/**
 * Calcule les couleurs de progression basées sur le pourcentage
 */
export function getProgressColors(progressPercent: number): ProgressColors {
  if (progressPercent >= 1.0) {
    // À jour : vert
    return {
      progressColor: '#22c55e',
      badgeColor: '#22c55e',
      textColor: '#22c55e'
    };
  } else if (progressPercent >= 0.7) {
    // 70% et plus : vert (proche de la fin)
    return {
      progressColor: '#22c55e',
      badgeColor: '#22c55e',
      textColor: '#22c55e'
    };
  } else if (progressPercent >= 0.4) {
    // 40-70% : orange (milieu)
    return {
      progressColor: '#fb923c',
      badgeColor: '#fb923c',
      textColor: '#fb923c'
    };
  } else {
    // Moins de 40% : rouge (début)
    return {
      progressColor: '#ef4444',
      badgeColor: '#ef4444',
      textColor: '#ef4444'
    };
  }
}

/**
 * Calcule la largeur de la barre de progression
 */
export function getProgressWidth(progressPercent: number): number {
  if (progressPercent >= 1.0) {
    // À jour : barre pleine
    return 100;
  } else if (progressPercent >= 0.7) {
    // 70% et plus : vert (proche de la fin)
    return Math.max(60, progressPercent * 90);
  } else if (progressPercent >= 0.4) {
    // 40-70% : orange (milieu)
    return Math.max(30, progressPercent * 80);
  } else {
    // Moins de 40% : rouge (début)
    return Math.max(10, progressPercent * 100);
  }
} 