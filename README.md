# Manga Tracker

Manga Tracker est une application de suivi de mangas composée de deux projets :

- **mobile/** : application React Native (Expo) permettant la recherche, la
  consultation et la gestion de la watchlist.
- **backend/** : API Node.js/Express avec MongoDB pour l'authentification, la
  watchlist, la progression de lecture et les notifications Telegram.

L'application utilise uniquement des sources publiques :
[MangaDex](https://api.mangadex.org) pour les chapitres et les métadonnées,
[AniList](https://anilist.co/graphiql) pour enrichir les fiches, et le bot
Telegram officiel pour les notifications.

## Prérequis

- Node.js 20+
- MongoDB Atlas ou instance MongoDB locale
- Compte BotFather (Telegram) pour créer un bot
- Expo CLI (`npm install -g expo`)

## Installation rapide

```bash
# Backend
cd backend
npm install
npm run dev

# Mobile
cd ../mobile
npm install
npx expo start
```

## Variables d'environnement

Créez un fichier `.env` dans `backend/` contenant :

```bash
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/mangatracker
JWT_SECRET=change-me
TELEGRAM_BOT_TOKEN=<token BotFather>
BOT_NAME=MonMangaBot
CRON_SCHEDULE=*/20 * * * *
```

Pour l'application mobile, définissez `EXPO_PUBLIC_API_URL` afin que le client
sache joindre l'API.

## Tests

```bash
cd backend
npm test
```

## Conformité

- Aucun contenu piraté n'est servi ni stocké.
- Toutes les données peuvent être supprimées via `DELETE /me`.
- Une politique de confidentialité est disponible à `GET /legal/privacy`.

## Licence

Projet fourni à titre d'exemple pédagogique.
