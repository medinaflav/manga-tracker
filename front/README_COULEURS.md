# 🎨 Gestion des Couleurs - Manga Tracker

## Système de Modes Light et Dark

L'application utilise maintenant deux modes distincts avec des couleurs optimisées pour chaque thème.

### 📍 Emplacement de la configuration

Les couleurs de fond sont définies dans le fichier :
```
front/constants/Colors.ts
```

### 🔧 Modification des couleurs de fond

Pour changer les couleurs de fond, modifiez les variables dans `Colors.ts` :

```typescript
// COULEURS DE FOND PRINCIPALES - MODIFIER ICI POUR CHANGER LES FONDS
const lightBackgroundColor = "#FFFFFF"; // Mode clair : fond blanc
const darkBackgroundColor = "#171717";  // Mode sombre : fond noir profond
```

### 🎯 Modes disponibles

#### 🌞 Mode Light (Clair)
- **Fond** : Blanc (`#FFFFFF`)
- **Texte** : Noir profond (`#1A1A1A`)
- **Idéal pour** : Lecture en journée, environnement lumineux

#### 🌙 Mode Dark (Sombre)
- **Fond** : Noir profond (`#171717`)
- **Texte** : Blanc (`#FFFFFF`)
- **Idéal pour** : Lecture nocturne, économie de batterie

### 🔄 Application automatique

Les couleurs sont automatiquement appliquées selon le mode sélectionné :
- ✅ **Mode Light** : Fond blanc + texte sombre
- ✅ **Mode Dark** : Fond sombre + texte blanc
- ✅ Toutes les pages s'adaptent automatiquement
- ✅ Les barres de statut s'ajustent
- ✅ Les icônes et éléments d'interface s'adaptent

### 🎨 Exemples de couleurs personnalisées

#### Mode Light (fond clair)
```typescript
const lightBackgroundColor = "#FFFFFF"; // Blanc pur
const lightBackgroundColor = "#F8FAFC"; // Blanc cassé
const lightBackgroundColor = "#F1F5F9"; // Gris très clair
```

#### Mode Dark (fond sombre)
```typescript
const darkBackgroundColor = "#171717"; // Noir profond (actuel)
const darkBackgroundColor = "#000000"; // Noir pur
const darkBackgroundColor = "#1a1a1a"; // Gris très sombre
const darkBackgroundColor = "#0f1419"; // Bleu nuit
```

### 📱 Changement de mode

Le mode change automatiquement selon :
- **Préférences système** : Suit les paramètres de votre appareil
- **Mode automatique** : Change selon l'heure de la journée
- **Mode manuel** : Sélectionné dans les paramètres de l'app

### 🔄 Redémarrage

Après modification, redémarrez l'application :
```bash
# Dans le dossier front/
npm start
# ou
expo start
```

### 💡 Conseils

- **Mode Light** : Utilisez des fonds clairs avec du texte sombre
- **Mode Dark** : Utilisez des fonds sombres avec du texte blanc
- Testez la lisibilité dans les deux modes
- Respectez les contrastes pour l'accessibilité
- Les couleurs actuelles offrent un excellent contraste

### 🎨 Personnalisation avancée

Vous pouvez aussi modifier les couleurs de surface, bordures, etc. dans chaque mode :

```typescript
light: {
  text: "#1A1A1A",        // Couleur du texte
  background: "#FFFFFF",  // Couleur de fond
  surface: "#F8FAFC",     // Couleur des cartes
  border: "#E2E8F0",      // Couleur des bordures
  // ...
}
```

---

*Dernière modification : ${new Date().toLocaleDateString('fr-FR')}* 