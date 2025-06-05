# Manga Tracker

Manga Tracker est une application mobile réalisée avec **React Native** (Expo) et un backend **Node.js/Express**. Elle a pour objectif de faciliter le suivi et la lecture de mangas.

## Fonctionnalités clés

- 🔍 **Recherche de mangas** via l'API **Mangadex**
- ✅ **Suivi de lecture** : marquer les chapitres comme lus ou non lus
- 📚 **Liste de suivi** pour retrouver facilement ses séries favorites
- 📖 **Lecture intégrée** des chapitres dans l'application
- 🔐 **Authentification** sécurisée (inscription et connexion)

## Démarrage rapide

### Prérequis

- [Node.js](https://nodejs.org/) installé sur votre machine

### Backend

```bash
cd back
npm install
npm run dev
```

Le serveur démarre par défaut sur le port `5000`.

### Frontend

```bash
cd front
npm install
npx expo start
```

Expo vous proposera ensuite d'ouvrir l'application sur un appareil ou un émulateur.

## Structure du dépôt

- `back/` – Serveur Express
- `front/` – Application React Native / Expo

Ce dépôt sert de base de travail pour l'application **Manga Tracker**.

### Variables d'environnement

Le backend utilise la variable `JWT_SECRET` pour signer les tokens. Vous pouvez la définir dans un fichier `.env` à la racine du dossier `back`.

## Endpoints principaux

- `POST /api/auth/register` – inscription d'un utilisateur
- `POST /api/auth/login` – connexion et récupération d'un token JWT
- `GET /api/manga/search?q=titre` – rechercher des mangas via Mangadex
- `GET /api/manga/chapter/:id` – récupérer les pages d'un chapitre
- `GET /api/manga/latest` – dernières sorties depuis Mangadex
- `POST /api/watchlist` – ajouter un manga à sa liste (token requis)
- `GET /api/watchlist` – lister les mangas suivis
- `POST /api/watchlist/progress` – marquer un chapitre comme lu
- `GET /api/watchlist/progress/:mangaId` – obtenir la progression
