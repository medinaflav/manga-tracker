# Manga Tracker

Manga Tracker est une application de suivi de mangas conçue pour être compatible App Store / Play Store. Elle se compose d'un frontend **React Native (Expo)** et d'un backend **Node.js/Express** avec **MongoDB**.

## Fonctionnalités
- Recherche de mangas via l'API publique **MangaDex**.
- Enrichissement des fiches avec **AniList**.
- Gestion d'une watchlist et de la progression de lecture.
- Notifications Telegram optionnelles lors de la sortie d'un nouveau chapitre.
- Conformité légale : aucune image de scan ou contenu piraté n'est servi.

## Démarrage
### Prérequis
- Node.js 20
- npm
- Compte MongoDB Atlas
- Token de bot Telegram

### Backend
```bash
cd back
npm install
npm run dev
```
Variables d'environnement clés :
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=supersecret
TELEGRAM_BOT_TOKEN=...
BOT_NAME=MonMangaBot
MANGADEX_BASE=https://api.mangadex.org
ANILIST_BASE=https://graphql.anilist.co
CRON_SCHEDULE=*/20 * * * *
```

### Frontend
```bash
cd front
npm install
npx expo start
```

## Tests
```bash
cd back
npm test
```

## Suppression de compte et vie privée
- Endpoint `DELETE /me` : supprime l'utilisateur et ses données (à implémenter).
- Politique de confidentialité accessible via `GET /legal/privacy` (à implémenter).

---
Ce projet utilise uniquement des APIs publiques autorisées et ne réalise aucun scraping.
