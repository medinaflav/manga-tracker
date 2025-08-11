/**
 * Identité visuelle de l'application Manga Tracker
 * Palette de couleurs cohérente et moderne
 */

// Couleurs principales de la marque
const primaryBlue = "#5D4FF2";
const secondaryBlue = "#0e4a80";
const accentBlue = "#E3F2FD";

// Couleurs de support
const successGreen = "#10B981";
const warningYellow = "#F59E0B";
const errorRed = "#EF4444";

// COULEURS DE FOND PRINCIPALES - MODIFIER ICI POUR CHANGER LES FONDS
const lightBackgroundColor = "#FFFFFF"; // Mode clair : fond blanc
const darkBackgroundColor = "#202328";  // Mode sombre : fond noir profond

// Couleurs sémantiques pour les états
const progressColors = {
  notStarted: "#EF4444",    // Rouge pour "pas commencé"
  inProgress: "#FB923C",    // Orange pour "en cours"
  almostDone: "#22C55E",    // Vert clair pour "presque fini"
  completed: "#22C55E",     // Vert pour "terminé"
  neutral: "#6B7280",       // Gris neutre
};

const tintColorLight = primaryBlue;
const tintColorDark = "#fff";

export const Colors = {
  light: {
    // Couleurs principales
    text: "#1A1A1A", // Texte sombre sur fond clair
    background: lightBackgroundColor,
    surface: "#F8FAFC",
    tint: tintColorLight,
    
    // Couleurs de la marque
    primary: primaryBlue,
    secondary: secondaryBlue,
    accent: accentBlue,
    accentSecondary: secondaryBlue,
    
    // Couleurs d'interface
    border: "#E2E8F0",
    muted: "#64748B",
    icon: "#64748B",
    tabIconDefault: "#64748B",
    tabIconSelected: primaryBlue,
    
    // Couleurs d'état
    success: successGreen,
    warning: warningYellow,
    error: errorRed,
    
    // Couleurs spéciales
    card: "#FFFFFF",
    cardBorder: "#F1F5F9",
    shadow: "#000000",
    overlay: "#000000",
    
    // Couleurs sémantiques
    progressNotStarted: progressColors.notStarted,
    progressInProgress: progressColors.inProgress,
    progressAlmostDone: progressColors.almostDone,
    progressCompleted: progressColors.completed,
    progressNeutral: progressColors.neutral,
    
    // Couleurs d'interface spécifiques
    dropdownSelected: "#F0F9FF",
    dropdownSelectedText: "#3B82F6",
    dropdownItem: "#FFFFFF",
    dropdownItemText: "#222222",
    dropdownBorder: "#D1D5DB",
    dropdownBackground: "#F3F4F6",
    placeholder: "#A1A1AA",
  },
  dark: {
    // Couleurs principales
    text: "#FFFFFF", // Texte blanc sur fond sombre
    background: darkBackgroundColor,
    surface: "#1E293B",
    tint: tintColorDark,
    
    // Couleurs de la marque
    primary: primaryBlue,
    secondary: secondaryBlue,
    accent: "#1E3A5F",
    accentSecondary: secondaryBlue,
    
    // Couleurs d'interface
    border: "#334155",
    muted: "#94A3B8",
    icon: "#94A3B8",
    tabIconDefault: "#94A3B8",
    tabIconSelected: primaryBlue,
    
    // Couleurs d'état
    success: successGreen,
    warning: warningYellow,
    error: errorRed,
    
    // Couleurs spéciales
    card: "#1E293B",
    cardBorder: "#334155",
    shadow: "#000000",
    overlay: "#000000",
    
    // Couleurs sémantiques
    progressNotStarted: progressColors.notStarted,
    progressInProgress: progressColors.inProgress,
    progressAlmostDone: progressColors.almostDone,
    progressCompleted: progressColors.completed,
    progressNeutral: progressColors.neutral,
    
    // Couleurs d'interface spécifiques
    dropdownSelected: "#1E3A5F",
    dropdownSelectedText: "#3B82F6",
    dropdownItem: "#1E293B",
    dropdownItemText: "#FFFFFF",
    dropdownBorder: "#334155",
    dropdownBackground: "#334155",
    placeholder: "#94A3B8",
  },
};
