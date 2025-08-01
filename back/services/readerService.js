const axios = require('axios');
const JSZip = require('jszip');

const MANGA_SITE_URL = 'https://mangamoins.shaeishu.co';

async function getScanImages(scanCode) {
  const downloadUrl = `${MANGA_SITE_URL}/download/?scan=${scanCode}`;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/zip, application/octet-stream, */*',
    'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
  };
  const response = await axios.get(downloadUrl, {
    responseType: 'arraybuffer',
    headers,
    timeout: 20000,
  });
  const zip = await JSZip.loadAsync(response.data);
  const imageFiles = Object.keys(zip.files).filter((filename) => /\.(png|jpg|jpeg|webp)$/i.test(filename));
  imageFiles.sort((a, b) => {
    const aMatch = a.match(/(\d+)/);
    const bMatch = b.match(/(\d+)/);
    const aNum = aMatch ? parseInt(aMatch[1]) : 0;
    const bNum = bMatch ? parseInt(bMatch[1]) : 0;
    if (aNum !== bNum) return aNum - bNum;
    return a.localeCompare(b);
  });
  const images = await Promise.all(
    imageFiles.map(async (filename) => {
      const file = zip.files[filename];
      const buffer = await file.async('nodebuffer');
      const mime = filename.endsWith('.png') ? 'image/png' : filename.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
      const base64 = buffer.toString('base64');
      return `data:${mime};base64,${base64}`;
    })
  );
  return images;
}

module.exports = { getScanImages };
