const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

const BASE_URL = 'https://www.scan-vf.net';

function getChapterDir(manga, chapter) {
  return path.join(__dirname, '../../downloads', manga, chapter);
}

function getLocalImages(manga, chapter) {
  const chapterDir = getChapterDir(manga, chapter);
  if (!fs.existsSync(chapterDir)) return [];
  return fs.readdirSync(chapterDir)
    .filter(f => /\.(webp|jpg|jpeg|png)$/i.test(f))
    .map(f => path.join('/downloads', manga, chapter, f));
}

async function downloadChapterImages(manga, chapter) {
  const mangaTitle = manga === "one-piece" ? "one_piece" : manga;
  const url = `${BASE_URL}/${mangaTitle}/chapitre-${chapter}`;
  console.log(`[scanvfService] URL du chapitre : ${url}`);
  const chapterDir = getChapterDir(manga, chapter);
  console.log(`[scanvfService] Téléchargement du chapitre ${chapter} de "${manga}" depuis ${url}`);
  if (!fs.existsSync(chapterDir)) {
    fs.mkdirSync(chapterDir, { recursive: true });
    console.log(`[scanvfService] Dossier créé : ${chapterDir}`);
  } else {
    console.log(`[scanvfService] Dossier déjà existant : ${chapterDir}`);
  }

  let data;
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': url
      }
    });
    data = response.data;
    console.log(`[scanvfService] Page récupérée avec succès`);
  } catch (err) {
    console.error(`[scanvfService] Erreur lors de la récupération de la page :`, err.message);
    throw err;
  }

  const $ = cheerio.load(data);
  const images = [];
  $('img.img-responsive').each((i, el) => {
    let src = $(el).attr('data-src') || $(el).attr('src');
    if (src) {
      src = src.trim().replace(/^'+|'+$/g, '').replace(/^"+|"+$/g, '');
      if (src.startsWith('http')) images.push(src);
    }
  });
  console.log(`[scanvfService] ${images.length} images trouvées dans le chapitre`);

  for (const imgUrl of images) {
    const filename = path.basename(imgUrl);
    const dest = path.join(chapterDir, filename);
    if (!fs.existsSync(dest)) {
      console.log(`[scanvfService] Téléchargement de l'image : ${imgUrl}`);
      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(imgUrl, (response) => {
          if (response.statusCode !== 200) {
            console.error(`[scanvfService] Erreur HTTP ${response.statusCode} pour ${imgUrl}`);
            file.close();
            fs.unlink(dest, () => {}); // Nettoyage du fichier partiel
            return reject(new Error(`HTTP ${response.statusCode}`));
          }
          response.pipe(file);
          file.on('finish', () => {
            file.close(() => {
              console.log(`[scanvfService] Image sauvegardée : ${dest}`);
              resolve();
            });
          });
        }).on('error', (err) => {
          console.error(`[scanvfService] Erreur lors du téléchargement de ${imgUrl} :`, err.message);
          file.close();
          fs.unlink(dest, () => {});
          reject(err);
        });
      });
    } else {
      console.log(`[scanvfService] Image déjà présente : ${dest}`);
    }
  }
  console.log(`[scanvfService] Téléchargement terminé pour le chapitre ${chapter} de "${manga}"`);
  return getLocalImages(manga, chapter);
}

module.exports = { getLocalImages, downloadChapterImages }; 