import axios from "axios";
import { api } from '@/utils/api';
import { useEffect, useState } from "react";
import React from "react";
import {
  Button,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from 'expo-router';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { useAuth } from '@/contexts/AuthContext';
import { MangaGrid } from '@/components/MangaGrid';
import { useTheme } from '@/contexts/ThemeContext';
import { Logo } from '@/components/Logo';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { Brand } from '@/constants/Brand';
import { Ionicons } from '@expo/vector-icons';


const POPULAR_TITLES = [
  "One Piece",
  "Kagurabachi",
  "Boruto - Two Blue Vortex",
  "Jujutsu Kaisen",
  "Solo Leveling",
  "SPY×FAMILY",
];

// Fonction utilitaire pour formater les titres
function formatTitle(title: string): string {
  if (!title) return title;
  
  return title
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Garder la première lettre en majuscule, le reste tel quel
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Fonction utilitaire pour extraire le titre d'un manga
function getMangaTitle(manga: any): string {
  return manga.attributes?.title?.en || Object.values(manga.attributes?.title || {})[0] || "Sans titre";
}

// Fonction utilitaire pour extraire l'URL de couverture d'un manga
function getCoverUrlFromManga(manga: any): string | null {
  if (!manga) return null;
  const coverFileName = manga?.relationships?.find((r: any) => r.type === "cover_art")?.attributes?.fileName;
  return coverFileName
    ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFileName}.256.jpg`
    : null;
}

async function fetchMangaDexInfo(title: string) {
  try {
    const formattedSearchTitle = formatTitle(title);

    // Si la recherche échoue, essayer avec le titre formaté
    try {
      const res = await api.get('/api/manga/search', {
        params: { q: formattedSearchTitle },
      });

      if (res.data.data && res.data.data.length > 0) {

        
        // Chercher la meilleure correspondance
        const exact = res.data.data.find((manga: any) => {
          const enTitle = getMangaTitle(manga);
          return enTitle?.toLowerCase() === formattedSearchTitle.toLowerCase();
        });
        
        const contains = !exact && res.data.data.find((manga: any) => {
          const enTitle = getMangaTitle(manga);
          return enTitle?.toLowerCase().includes(formattedSearchTitle.toLowerCase());
        });
        
        const startsWith = !exact && !contains && res.data.data.find((manga: any) => {
          const enTitle = getMangaTitle(manga);
          return enTitle?.toLowerCase().startsWith(formattedSearchTitle.toLowerCase());
        });
        
        const manga = exact || contains || startsWith || res.data.data[0];
        
        return {
          id: manga.id,
          title: getMangaTitle(manga),
          author: manga.attributes.author || "",
          description: manga.attributes.description.en || "",
          coverUrl: getCoverUrlFromManga(manga),
        };
      }
    } catch (error) {
      // Backend formatted search failed
    }

    return null;
    
  } catch (error) {
    return null;
  }
}

function getNumColumns() {
  const width = Dimensions.get("window").width;  
  if (width > 650) return 5;
  if (width > 450) return 4;
  if (width > 389) return 3;
  return 2;
}

// Supprime la fonction fillGridData et son utilisation

// Ajoute une fonction utilitaire pour générer des blocs gris pour le skeleton
function getSkeletonData(num: number) {
  return Array.from({ length: num }, (_, i) => ({ id: `skeleton-${i}`, skeleton: true }));
}

export const options = { headerShown: false };

export default function SearchScreen() {
  const router = useRouter();
  const { colors, currentTheme } = useTheme();
  const ready = useAuthRedirect();
  const { token, isAuthenticated } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [popular, setPopular] = useState<any[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [resumeList, setResumeList] = useState<any[]>([]);
  const [loadingResume, setLoadingResume] = useState(true);
  const [numColumns, setNumColumns] = useState(getNumColumns());
  const [refreshing, setRefreshing] = useState(false);
  const [latestChapters, setLatestChapters] = useState<any[]>([]);
  const [loadingLatest, setLoadingLatest] = useState(true);

  const onChange = () => setNumColumns(getNumColumns());

  // Fonction utilitaire pour charger les mangas populaires
  const loadPopularMangas = async () => {
    setLoadingPopular(true);
    try {
      const popularData = await Promise.all(POPULAR_TITLES.map(fetchMangaDexInfo));
      setPopular(popularData.filter(Boolean));
    } catch (error) {
      console.error('Erreur lors du chargement des mangas populaires:', error);
    } finally {
      setLoadingPopular(false);
    }
  };

  // Fonction utilitaire pour charger la liste de lecture
  const loadReadingProgress = async () => {
    setLoadingResume(true);
    try {
      const { data } = await api.get('/api/reading-progress', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('[INDEX] Reading progress items:', data.data?.length || 0);
      
      const enriched = await Promise.all(
        (data.data || []).map(async (item: any) => {
          // Utiliser le mangaTitle stocké en base s'il existe, sinon faire un appel API
          let mangaTitle = item.mangaTitle;
          let coverUrl = null;
          
          if (!mangaTitle) {
            // Fallback : chercher les infos via API
            const info = await fetchMangaDexInfo(item.mangaId);
            mangaTitle = info?.title || item.mangaId;
            coverUrl = info?.coverUrl || null;
          } else {
            // Si on a le titre, chercher juste la cover
            try {
              const info = await fetchMangaDexInfo(mangaTitle);
              coverUrl = info?.coverUrl || null;
            } catch (e) {
              console.error('Erreur récupération cover pour', mangaTitle, e);
            }
          }
          
          return {
            id: item.mangaId,
            mangaTitle: mangaTitle,
            chapter: item.chapter,
            page: item.page,
            coverUrl: coverUrl,
          };
        })
      );
      setResumeList(enriched);
    } catch (error: any) {
      console.error('Erreur lors du chargement de la liste de lecture:', error);
      if (error.response?.status === 401) {
        console.error('Token expiré ou invalide, redirection vers login');
        // Token expiré ou invalide, redirection vers login
      }
      setResumeList([]);
    } finally {
      setLoadingResume(false);
    }
  };

  const loadLatestChapters = async () => {
    setLoadingLatest(true);
    try {
      const { data } = await api.get('/api/mangamoins/latest');
      setLatestChapters(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des nouveautés:', error);
      setLatestChapters([]);
    } finally {
      setLoadingLatest(false);
    }
  };

  // Fonction pour recharger toutes les données
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadPopularMangas(), loadReadingProgress(), loadLatestChapters()]);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Chargement initial des données
  useEffect(() => {
    if (!ready || !token) return;
    
    let cancelled = false;
    loadPopularMangas();
    loadReadingProgress();
    loadLatestChapters();
    const subscription = Dimensions.addEventListener("change", onChange);
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [ready, token]);

  // Recharger les données quand l'écran redevient actif
  useFocusEffect(
    React.useCallback(() => {
      if (ready && token) {
        loadReadingProgress();
        loadLatestChapters();
      }
    }, [ready, token])
  );

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    api.get('/api/manga/search', { params: { q: query } })
      .then(({ data }) => {
        // Ajoute coverUrl et formate les titres
        const mapped = (data.data || []).map((manga: any) => ({
          ...manga,
          coverUrl: getCoverUrlFromManga(manga),
          title: getMangaTitle(manga),
        }));
        setResults(mapped);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [query]);

  if (!ready || !token) return null;

  const openLatestChapter = (item: any) => {
    // Extraire le code de scan de l'URL (ex: ?scan=OP1156 -> OP1156)
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

  console.log('[INDEX] Resume list:', resumeList);
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
              <StatusBar barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* <View style={styles.headerContainer}>
          <Logo size="large" />
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {Brand.tagline}
          </Text>
        </View> */}
        
        <Card style={{
          marginHorizontal: 15,
          marginBottom: 22,
          backgroundColor: colors.surface,
          // borderWidth: 1,
          // borderColor: colors.border,
          borderRadius: 50,
        }}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={24} style={[styles.searchIcon, { color: colors.muted }]} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={Brand.placeholders.search}
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
              enablesReturnKeyAutomatically
            />
          </View>
        </Card>
        
        {query ? (
          loading ? (
            <MangaGrid
              data={[]} // Pass an empty array for skeleton
              loading={true}
              onItemPress={() => {}}
              showChapter={false}
              emptyText={Brand.messages.loading}
              numColumns={numColumns}
              getSkeletonData={getSkeletonData}
            />
          ) : (
            <MangaGrid
              data={results}
              loading={false}
              onItemPress={(item) => router.push(`/manga/${item.id}` as any)}
              showChapter={false}
              emptyText={Brand.messages.noResults}
              numColumns={numColumns}
              getSkeletonData={getSkeletonData}
            />
          )
        ) : (
          <>
            {/* Section Reprendre la lecture */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{Brand.sections.resume}</Text>
                <Badge variant="primary" size="small" rounded>
                  {resumeList.length}
                </Badge>
              </View>
              
              {loadingResume ? (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScrollContainer}
                >
                  {getSkeletonData(6).map((item, index) => (
                    <View key={index} style={styles.horizontalItem}>
                      <View style={[styles.horizontalCoverContainer, { backgroundColor: colors.border }]}>
                        {/* Placeholder pour la cover */}
                      </View>
                      <View style={styles.horizontalInfo}>
                        <View style={[styles.skeletonTitle, { backgroundColor: colors.border }]} />
                        <View style={[styles.skeletonChapter, { backgroundColor: colors.border }]} />
                      </View>
                    </View>
                  ))}
                </ScrollView>
              ) : resumeList.length > 0 ? (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScrollContainer}
                >
                  {resumeList.map((item, index) => (
                    <TouchableOpacity
                      key={item.id || index}
                      style={styles.horizontalItem}
                      onPress={() => router.push(`/reader?slug=${item.id}&chapter=${item.chapter}&page=${item.page}&mangaTitle=${encodeURIComponent(item.mangaTitle)}` as any)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.horizontalCoverContainer}>
                        {item.coverUrl ? (
                          <Image source={{ uri: item.coverUrl }} style={styles.horizontalCover} />
                        ) : (
                          <View style={[styles.horizontalCoverPlaceholder, { backgroundColor: colors.border }]}>
                            <Text style={[styles.placeholderText, { color: colors.muted }]}>📚</Text>
                          </View>
                        )}
                        <View style={[styles.horizontalOverlay, { backgroundColor: colors.primary + '20' }]} />
                      </View>
                      <View style={styles.horizontalInfo}>
                        <Text style={[styles.horizontalTitle, { color: colors.text }]} numberOfLines={2}>
                          {item.mangaTitle}
                        </Text>
                        <Text style={[styles.horizontalChapter, { color: colors.primary }]}>
                          Ch. {item.chapter}{item.page > 0 ? ` P.${item.page}` : ''}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.muted }]}>
                    Aucune lecture en cours
                  </Text>
                </View>
              )}
            </View>
            
            {/* Section Nouveautés */}
            {/* Section Nouveautés temporairement cachée */}
            
            {/* Section Les plus populaires */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{Brand.sections.popular}</Text>
              </View>
              {loadingPopular ? (
                <MangaGrid
                  data={getSkeletonData(numColumns * 2)}
                  loading={true}
                  onItemPress={() => {}}
                  showChapter={false}
                  emptyText={Brand.messages.loading}
                  numColumns={numColumns}
                  getSkeletonData={getSkeletonData}
                />
              ) : (
                <MangaGrid
                  data={popular}
                  loading={false}
                  onItemPress={(item) => router.push(`/manga/${item.id}` as any)}
                  showChapter={false}
                  emptyText={Brand.messages.noResults}
                  numColumns={numColumns}
                  getSkeletonData={getSkeletonData}
                />
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  container: {
    flex: 1,
    paddingVertical: 20,
  },
  headerContainer: {
    alignItems: 'flex-start',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  searchCard: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
  },
  sectionContainer: {
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  horizontalScrollContainer: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  horizontalItem: {
    width: 110, // Réduit de 120 à 110 pour mieux s'adapter à la nouvelle hauteur
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  horizontalCoverContainer: {
    position: 'relative',
    width: '100%',
    height: 150, // Réduit de 180 à 150 pour iPhone
    borderRadius: 8,
    overflow: 'hidden',
  },
  horizontalCover: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  horizontalCoverPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  placeholderText: {
    fontSize: 40,
  },
  horizontalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
  },
  horizontalInfo: {
    paddingHorizontal: 5,
    paddingTop: 5,
  },
  horizontalTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  horizontalChapter: {
    fontSize: 10,
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  skeletonCover: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  skeletonInfo: {
    paddingHorizontal: 5,
    paddingTop: 5,
  },
  skeletonTitle: {
    width: '80%',
    height: 14,
    borderRadius: 7,
    marginBottom: 4,
  },
  skeletonChapter: {
    width: '60%',
    height: 12,
    borderRadius: 6,
  },
});
