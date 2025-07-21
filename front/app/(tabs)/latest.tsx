import axios from 'axios';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// URL du site à scraper
const MANGA_SITE_URL = 'https://mangamoins.shaeishu.co/';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Récupère l'URL de la couverture d'un manga depuis l'API MangaDex.
 * @param mangaTitle Le titre du manga à rechercher.
 * @returns L'URL de l'image ou null si non trouvée.
 */
const getMangaCoverUrl = async (mangaTitle: string): Promise<string | null> => {
  if (!mangaTitle || mangaTitle === 'Manga' || mangaTitle === 'Auteur inconnu') {
    return null;
  }
  try {
    // 1. Chercher l'ID du manga par titre
    const mangaRes = await axios.get(`https://api.mangadex.org/manga?title=${encodeURIComponent(mangaTitle)}`);
    const mangaData = mangaRes.data?.data;
    if (!mangaData || mangaData.length === 0) {
      console.log(`No MangaDex manga found for ${mangaTitle}`);
      return null;
    }
    const mangaId = mangaData[0].id;

    // 2. Récupérer la couverture liée
    const coverRes = await axios.get(`https://api.mangadex.org/cover?manga[]=${mangaId}`);
    const coverData = coverRes.data?.data;
    if (!coverData || coverData.length === 0) {
      console.log(`No MangaDex cover found for ${mangaTitle}`);
      return null;
    }
    const fileName = coverData[0].attributes.fileName;

    // 3. Construire l'URL finale
    const coverUrl = `https://uploads.mangadex.org/covers/${mangaId}/${fileName}`;
    console.log(`MangaDex cover for ${mangaTitle}: ${coverUrl}`);
    return coverUrl;
  } catch (error) {
    console.warn(`Could not fetch MangaDex cover for "${mangaTitle}":`, error);
    return null;
  }
};

export default function LatestScreen() {
  const router = useRouter();
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Récupère les couvertures pour une liste de chapitres en arrière-plan.
   * Ne fait qu'un seul appel par titre de manga unique.
   */
  const fetchChapterCovers = (chaptersToUpdate: any[]) => {
    // 1. Extraire les titres de manga uniques de la liste
    const uniqueMangaTitles = [
      ...new Set(chaptersToUpdate.map(c => c.manga).filter(Boolean))
    ];

    // 2. Pour chaque titre, récupérer l'image et mettre à jour l'état
    uniqueMangaTitles.forEach(async (title) => {
      const imageUrl = await getMangaCoverUrl(title);
      
      if (imageUrl) {
        // Mettre à jour tous les chapitres correspondants dans la liste
        setChapters(prevChapters =>
          prevChapters.map(chapter =>
            chapter.manga === title ? { ...chapter, image: imageUrl } : chapter
          )
        );
      }
    });
  };

  // Calculer la largeur dynamique des cartes
  const screenWidth = Dimensions.get('window').width;
  const getCardWidth = () => {
    const padding = 32; // 16px de chaque côté
    const margin = 48; // 12px entre chaque carte
    const availableWidth = screenWidth - padding;
    
    // Essayer 5 cartes
    if (availableWidth >= 5 * 200 + 4 * margin) {
      return (availableWidth - 4 * margin) / 5;
    }
    // Essayer 4 cartes
    else if (availableWidth >= 4 * 200 + 3 * margin) {
      return (availableWidth - 3 * margin) / 4;
    }
    // Essayer 3 cartes
    else if (availableWidth >= 3 * 200 + 2 * margin) {
      return (availableWidth - 2 * margin) / 3;
    }
    // Sinon 2 cartes
    else {
      return (availableWidth - margin) / 2;
    }
  };





  useEffect(() => {
    load();
  }, []);

  const scrapeBackend = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/mangamoins/latest`);
      return data;
    } catch (err) {
      console.log('Backend scrape failed:', err);
      return [];
    }
  };

  /**
   * Tentative de scraping avec différents services proxy (version web-compatible)
   */
  const scrapeWithProxy = async () => {
    const proxies = [
      {
        url: `https://api.allorigins.win/get?url=${encodeURIComponent(MANGA_SITE_URL)}`,
        transform: (data: any) => data.contents || data
      },
      {
        url: `https://corsproxy.io/?${encodeURIComponent(MANGA_SITE_URL)}`,
        transform: (data: any) => data
      },
      {
        url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(MANGA_SITE_URL)}`,
        transform: (data: any) => data
      }
    ];

    for (const proxy of proxies) {
      try {
        setScrapingStatus(`Tentative avec proxy: ${proxy.url.split('/')[2]}`);
        console.log(`Tentative avec: ${proxy.url}`);

        const response = await axios.get(proxy.url, {
          timeout: 15000,
          // Headers minimaux pour éviter les erreurs de sécurité
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          }
        });

        let htmlContent = proxy.transform(response.data);
        console.log('HTML reçu:', htmlContent?.substring(0, 500) || 'Pas de contenu');

        // Vérifier si on a du contenu valide (pas la page Cloudflare)
        if (htmlContent &&
          typeof htmlContent === 'string' &&
          !htmlContent.includes('Just a moment') &&
          !htmlContent.includes('Cloudflare') &&
          !htmlContent.includes('cf-browser-verification') &&
          htmlContent.includes('<div class="sortie">') &&
          htmlContent.length > 1000) {

          // console.log(htmlContent);

          const chapters = parseMangaChapters(htmlContent);
          if (chapters.length > 0) {
            setScrapingStatus(`Succès avec ${chapters.length} chapitres trouvés`);
            return chapters;
          }
        }
      } catch (error: any) {
        console.log(`Échec avec ${proxy.url}:`, error.message);
        setScrapingStatus(`Échec: ${error.message}`);
        continue;
      }
    }
    return [];
  };

  /**
   * Tentative de scraping direct (version web-compatible)
   */
  const scrapeDirect = async () => {
    try {
      setScrapingStatus('Tentative de scraping direct...');
      console.log('Tentative de scraping direct...');

      const response = await axios.get(MANGA_SITE_URL, {
        timeout: 15000,
        // Headers minimaux pour éviter les erreurs de sécurité
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        }
      });

      console.log('Réponse directe reçue:', response.data?.substring(0, 500) || 'Pas de contenu');

      if (response.data &&
        typeof response.data === 'string' &&
        !response.data.includes('Just a moment') &&
        response.data.length > 1000) {
        return parseMangaChapters(response.data);
      }
    } catch (error: any) {
      console.log('Échec du scraping direct:', error.message);
      setScrapingStatus(`Échec direct: ${error.message}`);
    }
    return [];
  };

  /**
   * Parse le HTML pour extraire les informations des chapitres
   * Version adaptée à la structure réelle de mangamoins.shaeishu.co
   */
  const parseMangaChapters = (htmlContent: string) => {
    const chapters: any[] = [];

    try {
      // Pattern spécifique pour la structure de mangamoins.shaeishu.co
      const sortiePattern = /<div class="sortie">\s*<a href='([^']+)'>\s*<figure>\s*<img[^>]+src="([^"]+)"[^>]+alt="([^"]+)"[^>]*>\s*<figcaption>\s*<p>([^<]+)<span>([^<]+)<\/span><\/p>\s*<\/figcaption>\s*<\/figure>\s*<div class="sortiefooter">\s*<h3>([^<]+)<\/h3>\s*<p>([^<]+)<\/p>\s*<h4>([^<]+)<\/h4>\s*<\/div>\s*<\/a>\s*<\/div>/gi;

      let match;
      let chapterCount = 0;
      const maxChapters = 20;
      const seenTitles = new Set<string>();

      while ((match = sortiePattern.exec(htmlContent)) !== null && chapterCount < maxChapters) {
        const [
          fullMatch,
          scanLink,      // ?scan=OP1155
          imageSrc,      // ./files/scans/OP1155/thumbnail.png
          altText,       // Cover One piece
          mangaTitle,    // One piece
          author,        // Eiichiro Oda
          chapterNumber, // #1155
          chapterTitle,  // L'équipage des Rocks
          language       // FR
        ] = match;

        // Créer un titre complet
        // const fullTitle = `${mangaTitle} - Chapitre ${chapterNumber.replace('#', '')} - ${chapterTitle}`;
        const fullTitle = `${mangaTitle} - Chapitre ${chapterNumber.replace('#', '')}`;

        // Éviter les doublons
        if (!seenTitles.has(fullTitle.toLowerCase())) {
          seenTitles.add(fullTitle.toLowerCase());

          chapters.push({
            id: `chapter-${chapterCount}`,
            title: fullTitle,
            manga: mangaTitle,
            chapter: chapterNumber.replace('#', ''),
            subtitle: chapterTitle,
            author: author,
            language: language,
            image: '',
            link: `${MANGA_SITE_URL}${scanLink}`,
            date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
            source: 'mangamoins.shaeishu.co'
          });

          chapterCount++;
        }
      }

      // Si aucun chapitre trouvé avec le pattern principal, essayer un pattern plus général
      if (chapters.length === 0) {
        console.log('Pattern principal échoué, tentative avec pattern général...');

        // Pattern général pour les liens de scan avec image
        const generalScanPattern = /<a href='\?scan=([^']+)'>[^<]*<img[^>]+src="([^"]+)"[^>]*>[^<]*<h3>([^<]+)<\/h3>[^<]*<p>([^<]+)<\/p>/gi;

        while ((match = generalScanPattern.exec(htmlContent)) !== null && chapterCount < maxChapters) {
          const scanCode = match[1]; // OP1155
          const imageSrc = match[2]; // ./files/scans/OP1155/thumbnail.png
          const chapterNum = match[3]; // #1155
          const chapterTitle = match[4]; // L'équipage des Rocks

          const fullTitle = `Manga - Chapitre ${chapterNum.replace('#', '')} - ${chapterTitle}`;

          if (!seenTitles.has(fullTitle.toLowerCase())) {
            seenTitles.add(fullTitle.toLowerCase());

            chapters.push({
              id: `chapter-${chapterCount}`,
              title: fullTitle,
              manga: 'Manga',
              chapter: chapterNum.replace('#', ''),
              subtitle: chapterTitle,
              author: 'Auteur inconnu',
              language: 'FR',
              image: '',
              link: `${MANGA_SITE_URL}?scan=${scanCode}`,
              date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
              source: 'mangamoins.shaeishu.co'
            });
            console.log(imageSrc);

            chapterCount++;
          }
        }
      }

      console.log(`Parsing terminé: ${chapters.length} chapitres trouvés`);

    } catch (error) {
      console.error('Erreur lors du parsing:', error);
    }

    return chapters;
  };

  const load = async () => {
    setLoading(true);

    try {
      let chapters = await scrapeBackend();

      if (chapters.length === 0) {
        chapters = await scrapeDirect();
      }

      if (chapters.length === 0) {
        chapters = await scrapeWithProxy();
      }

      console.log('Chapitres trouvés:', chapters);

      setChapters(chapters);

      if (chapters.length > 0) {
        fetchChapterCovers(chapters);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setChapters([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openChapter = (item: any) => {
    // Extraire le code de scan de l'URL (ex: ?scan=OP1155 -> OP1155)
    const scanCode = item.link.split('scan=')[1];
    console.log('Opening scan:', scanCode);
    
    // Naviguer vers le lecteur avec les paramètres
    router.push({
      pathname: '/reader',
      params: {
        scanCode: scanCode,
        mangaTitle: item.manga,
        chapter: item.chapter
      }
    });
  };

    const styles = getStyles();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Dernières sorties</Text>
      {/* <Text style={styles.subtitle}>Source: mangamoins.shaeishu.co</Text> */}
      
      {loading ? (
        <View style={styles.center}>
          <Text>Chargement...</Text>
        </View>
      ) : (
        <FlatList
          data={chapters}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => {
            // console.log('Rendering item:', item);
            return (
              <TouchableOpacity 
                style={styles.item}
                activeOpacity={0.85}
                onPress={() => openChapter(item)}
              >
                <View style={styles.row}>
                  {/* Image de couverture (placeholder si vide) */}
                  <View style={styles.coverContainer}>
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.coverImage} />
                    ) : (
                      <View style={styles.coverPlaceholder}>
                        <Text style={styles.coverPlaceholderText}>IMG</Text>
                      </View>
                    )}
                  </View>
                  {/* Infos */}
                  <View style={styles.infoContainer}>
                    <View style={styles.headerRow}>
                      <Text style={styles.mangaTitle}>{item.manga}</Text>
                      <View style={styles.dateBadge}>
                        <Text style={styles.dateBadgeText}>{item.date}</Text>
                      </View>
                    </View>
                    <Text style={styles.author}>{item.author}</Text>
                    <View style={styles.chapterInfoRow}>
                      <Text style={styles.chapterNumber}>Chapitre {item.chapter}</Text>
                      <Text style={styles.language}>{item.language}</Text>
                    </View>
                    <Text style={styles.chapterTitle}>{item.subtitle}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text>Aucun chapitre trouvé</Text>
              <Text style={styles.errorText}>
                Protection Cloudflare active
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const getStyles = () => StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'left',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  item: {
    backgroundColor: 'white',
    marginBottom: 16,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    padding: 0,
    overflow: 'hidden',
    // Effet tactile (transition supprimée car non supportée)
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  coverContainer: {
    width: 56,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#ececec',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  coverImage: {
    width: 56,
    height: 80,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    width: 56,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholderText: {
    color: '#bbb',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  mangaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  dateBadge: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  dateBadgeText: {
    fontSize: 11,
    color: '#888',
    fontWeight: 'bold',
  },
  author: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  chapterInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  chapterNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6', // Accent bleu
    marginRight: 8,
  },
  language: {
    fontSize: 11,
    color: '#999',
    fontWeight: 'bold',
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  chapterTitle: {
    fontSize: 13,
    color: '#444',
    lineHeight: 16,
    marginTop: 2,
    fontStyle: 'italic',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
});
