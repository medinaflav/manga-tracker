import axios from "axios";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { scrapeMangaMoinsLatest } from '../../hooks/useMangaMoinsScraper';

// URL du site à scraper
const MANGA_SITE_URL = "https://mangamoins.shaeishu.co/";
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

/**
 * Récupère l'URL de la couverture d'un manga depuis l'API MangaDex.
 * @param mangaTitle Le titre du manga à rechercher.
 * @returns L'URL de l'image ou null si non trouvée.
 */
// SUPPRIMER la fonction getMangaCoverUrl du front

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
      ...new Set(chaptersToUpdate.map((c) => c.manga).filter(Boolean)),
    ];

    // 2. Pour chaque titre, récupérer l'image et mettre à jour l'état
    uniqueMangaTitles.forEach(async (title) => {
      try {
        const response = await axios.get(`${API_URL}/api/manga/cover`, { params: { title } });
        const imageUrl = response.data?.url;
        if (imageUrl) {
          setChapters((prevChapters) =>
            prevChapters.map((chapter) =>
              chapter.manga === title ? { ...chapter, image: imageUrl } : chapter,
            ),
          );
        }
      } catch (error) {
        // Optionnel : log ou fallback
      }
    });
  };

  // Calculer la largeur dynamique des cartes
  const screenWidth = Dimensions.get("window").width;
  // SUPPRESSION de getCardWidth (non utilisé)

  // ⚠️ Si tu veux ajouter 'load' en dépendance, il faut le déclarer avec useCallback
  useEffect(() => {
    load();
  }, []); // Pas de dépendance pour éviter l'erreur de déclaration

  const scrapeBackend = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/mangamoins/latest`);
      return data;
    } catch (err) {
      console.log("Backend scrape failed:", err);
      return [];
    }
  };

  // SUPPRIMER parseMangaChapters, scrapeDirect, scrapeWithProxy

  const load = async () => {
    setLoading(true);
    console.log("Tentative de récupération via le backend...");
    try {
      let chapters = await scrapeBackend();
      if (!chapters || chapters.length === 0) {
        console.log("Tentative de scraping direct côté front...");
        chapters = await scrapeMangaMoinsLatest();
      }
      setChapters(chapters);
      if (chapters.length > 0) {
        fetchChapterCovers(chapters);
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
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
    const scanCode = item.link.split("scan=")[1];
    console.log("Opening scan:", scanCode);

    // Naviguer vers le lecteur avec les paramètres
    router.push({
      pathname: "/reader",
      params: {
        scanCode: scanCode,
        mangaTitle: item.manga,
        chapter: item.chapter,
      },
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
                      <Image
                        source={{ uri: item.image }}
                        style={styles.coverImage}
                      />
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
                      <Text style={styles.chapterNumber}>
                        Chapitre {item.chapter}
                      </Text>
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
              <Text style={styles.errorText}>Protection Cloudflare active</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: "#f5f5f5",
    },
    header: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 15,
      textAlign: "left",
    },
    subtitle: {
      fontSize: 12,
      color: "#666",
      textAlign: "left",
      marginBottom: 16,
      fontStyle: "italic",
    },
    item: {
      backgroundColor: "white",
      marginBottom: 16,
      borderRadius: 14,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      padding: 0,
      overflow: "hidden",
      // Effet tactile (transition supprimée car non supportée)
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
    },
    coverContainer: {
      width: 56,
      height: 80,
      borderRadius: 8,
      backgroundColor: "#ececec",
      marginRight: 16,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    coverImage: {
      width: 56,
      height: 80,
      borderRadius: 8,
      resizeMode: "cover",
    },
    coverPlaceholder: {
      width: 56,
      height: 80,
      borderRadius: 8,
      backgroundColor: "#e0e0e0",
      justifyContent: "center",
      alignItems: "center",
    },
    coverPlaceholderText: {
      color: "#bbb",
      fontSize: 12,
      fontWeight: "bold",
    },
    infoContainer: {
      flex: 1,
      flexDirection: "column",
      justifyContent: "center",
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 2,
    },
    mangaTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#222",
      textTransform: "uppercase",
      flexShrink: 1,
    },
    dateBadge: {
      backgroundColor: "#f0f0f0",
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginLeft: 8,
      alignSelf: "flex-start",
    },
    dateBadgeText: {
      fontSize: 11,
      color: "#888",
      fontWeight: "bold",
    },
    author: {
      fontSize: 12,
      color: "#666",
      marginBottom: 4,
    },
    chapterInfoRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 2,
    },
    chapterNumber: {
      fontSize: 14,
      fontWeight: "bold",
      color: "#3b82f6", // Accent bleu
      marginRight: 8,
    },
    language: {
      fontSize: 11,
      color: "#999",
      fontWeight: "bold",
      backgroundColor: "#f3f4f6",
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    chapterTitle: {
      fontSize: 13,
      color: "#444",
      lineHeight: 16,
      marginTop: 2,
      fontStyle: "italic",
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      fontSize: 12,
      color: "#999",
      marginTop: 8,
    },
    errorText: {
      fontSize: 12,
      color: "#999",
      textAlign: "center",
      marginTop: 8,
    },
  });
