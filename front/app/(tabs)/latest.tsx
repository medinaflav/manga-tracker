import axios from 'axios';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/utils/api';
import { FlatList, StyleSheet, Text, View, SafeAreaView, StatusBar, TouchableOpacity, Image, RefreshControl, ScrollView, Animated, Dimensions } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { MangaGrid } from '@/components/MangaGrid';
import { Logo } from '@/components/Logo';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { useTheme } from '@/contexts/ThemeContext';
import { scrapeMangaMoinsLatest } from '../../hooks/useMangaMoinsScraper';

// URL du site à scraper
const MANGA_SITE_URL = "https://mangamoins.shaeishu.co/";

/**
 * Récupère l'URL de la couverture d'un manga depuis l'API MangaDex.
 * @param mangaTitle Le titre du manga à rechercher.
 * @returns L'URL de l'image ou null si non trouvée.
 */

export default function LatestScreen() {
  const router = useRouter();
  const { colors, currentTheme } = useTheme();
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
        const response = await api.get('/api/manga/cover', { params: { title } });
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
  // Largeur dynamique des cartes

  // Chargement initial
  useEffect(() => {
    load();
  }, []);

  // Recharger quand l'écran redevient actif
  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const scrapeBackend = async () => {
    try {
      const { data } = await api.get('/api/mangamoins/latest');
      return data;
    } catch (err) {
      return [];
    }
  };


  const load = useCallback(async () => {
    setLoading(true);
    try {
      let chapters = await scrapeBackend();
      if (!chapters || chapters.length === 0) {
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
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openChapter = (item: any) => {
    // Extraire le code de scan de l'URL (ex: ?scan=OP1155 -> OP1155)
    const scanCode = item.link.split("scan=")[1];

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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
              <StatusBar barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.headerContainer}>
          <Text style={[styles.header, { color: colors.text }]}>Dernières sorties</Text>
          <View style={[styles.headerBadge, { backgroundColor: colors.accent }]}>
            <Text style={[styles.headerBadgeText, { color: colors.primary }]}>{chapters.length}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <View style={[styles.loadingIcon, { backgroundColor: colors.accent }]}>
              <Text style={[styles.loadingIconText, { color: colors.primary }]}>📚</Text>
            </View>
            <Text style={[styles.loadingText, { color: colors.muted }]}>Chargement...</Text>
          </View>
        ) : (
          <FlatList
            data={chapters}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            renderItem={({ item }) => {
              return (
                <TouchableOpacity
                  style={[styles.item, { backgroundColor: colors.surface, shadowColor: colors.text }]}
                  activeOpacity={0.85}
                  onPress={() => openChapter(item)}
                >
                  <View style={styles.row}>
                    <View style={[styles.coverContainer, { backgroundColor: colors.border }]}>
                      {item.image ? (
                        <Image
                          source={{ uri: item.image }}
                          style={styles.coverImage}
                        />
                      ) : (
                        <View style={[styles.coverPlaceholder, { backgroundColor: colors.border }]}>
                          <Text style={[styles.coverPlaceholderText, { color: colors.muted }]}>📚</Text>
                        </View>
                      )}
                      <View style={[styles.coverOverlay, { backgroundColor: colors.primary + '20' }]} />
                    </View>
                    <View style={styles.infoContainer}>
                      <View style={styles.headerRow}>
                        <Text style={[styles.mangaTitle, { color: colors.text }]}>{item.manga}</Text>
                        <View style={[styles.dateBadge, { backgroundColor: colors.accent }]}>
                          <Text style={[styles.dateBadgeText, { color: colors.primary }]}>{item.date}</Text>
                        </View>
                      </View>
                      <Text style={[styles.author, { color: colors.muted }]}>{item.author}</Text>
                      <View style={styles.chapterInfoRow}>
                        <View style={[styles.chapterBadge, { backgroundColor: colors.primary }]}>
                          <Text style={[styles.chapterNumber, { color: colors.background }]}>
                            Chapitre {item.chapter}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.chapterTitle, { color: colors.text }]}>{item.subtitle}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.center}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.emptyIconText, { color: colors.primary }]}>📚</Text>
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun chapitre trouvé</Text>
                <Text style={[styles.errorText, { color: colors.muted }]}>Protection Cloudflare active</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 32,
    alignItems: 'center',
  },
  headerBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  item: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    padding: 0,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  coverContainer: {
    width: 60,
    height: 85,
    borderRadius: 12,
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: 'relative',
  },
  coverImage: {
    width: 60,
    height: 85,
    borderRadius: 12,
    resizeMode: "cover",
  },
  coverPlaceholder: {
    width: 60,
    height: 85,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  coverPlaceholderText: {
    fontSize: 20,
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
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
    marginBottom: 4,
  },
  mangaTitle: {
    fontSize: 17,
    fontWeight: "700",
    textTransform: "uppercase",
    flexShrink: 1,
    letterSpacing: -0.3,
  },
  dateBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
    alignSelf: "flex-start",
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  author: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },
  chapterInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  chapterBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  chapterNumber: {
    fontSize: 12,
    fontWeight: "700",
  },
  chapterTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: "italic",
    opacity: 0.8,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loadingIconText: {
    fontSize: 32,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyIconText: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
