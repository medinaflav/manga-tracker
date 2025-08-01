/**
 * Identité visuelle de l'application Manga Tracker
 * Palette de couleurs cohérente et moderne
 */

// Couleurs principales de la marque
const primaryBlue = "#0F75D1";
const secondaryBlue = "#0e4a80";
const accentBlue = "#E3F2FD";

// Couleurs de support
const successGreen = "#10B981";
const warningYellow = "#F59E0B";
const errorRed = "#EF4444";

const tintColorLight = primaryBlue;
const tintColorDark = "#fff";

export const Colors = {
  light: {
    // Couleurs principales
    text: "#1A1A1A",
    background: "#FFFFFF",
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
  },
  dark: {
    // Couleurs principales
    text: "#F8FAFC",
    background: "#0F172A",
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
  },
};
