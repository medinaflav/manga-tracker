import axios from 'axios';
import { useState, useCallback, useEffect, useRef } from 'react';
import { api } from '@/utils/api';
import { FlatList, StyleSheet, Text, View, SafeAreaView, StatusBar, TouchableOpacity, Image, RefreshControl, ScrollView, Animated, Modal, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { useTheme } from '@/contexts/ThemeContext';
import { Logo } from '@/components/Logo';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { Swipeable } from 'react-native-gesture-handler';
import { useChapterDetection } from '@/hooks/useChapterDetection';
import { useProgressColors } from '@/hooks/useProgressColors';


// Récupère les infos détaillées d'un manga depuis MangaDex
async function fetchMangaDexInfoById(mangaId: string) {
  try {
    const res = await api.get(`/api/manga/mangadex/${mangaId}`);
    const manga = res.data.data;
    const coverRel = manga?.relationships?.find((r: any) => r.type === "cover_art");
    const coverUrl = coverRel && coverRel.attributes && coverRel.attributes.fileName
      ? `https://uploads.mangadex.org/covers/${mangaId}/${coverRel.attributes.fileName}.256.jpg`
      : null;
    const authorRel = manga?.relationships?.find((r: any) => r.type === "author");
    const author = authorRel && authorRel.attributes && authorRel.attributes.name
      ? authorRel.attributes.name
      : "Auteur inconnu";
    // Récupère le nombre total de chapitres via backend
    let totalChapters = null;
    try {
      const chaptersRes = await api.get(`/api/manga/mangadex/${mangaId}/chapters`);
      totalChapters = chaptersRes.data.totalChapters;
    } catch (e) {
      // Erreur récupération totalChapters
    }
    return {
      id: mangaId,
      title: manga.attributes?.title?.en || Object.values(manga.attributes?.title || {})[0] || "Sans titre",
      author,
      coverUrl,
      totalChapters,
    };
  } catch (e) {
    return null;
  }
}


export default function WatchlistScreen() {
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();
  const ready = useAuthRedirect();
  const { colors, currentTheme } = useTheme();
  const [detailed, setDetailed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);
  const [hasData, setHasData] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [mangaToDelete, setMangaToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const { detectChapters } = useChapterDetection();

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const itemAnimations = useRef<Animated.Value[]>([]).current;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get('/api/watchlist', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('[WATCHLIST] Watchlist data:', data);
      if (!data || !Array.isArray(data)) {
        setDetailed([]);
        return;
      }

      // Afficher d'abord les données de base
      const initialData = data.map((m: any) => ({ ...m, loading: true }));
      setDetailed(initialData);

      // Charger les détails en arrière-plan
      const details = await Promise.all(
        data.map(async (m: any, index: number) => {
          try {
            const info = await fetchMangaDexInfoById(m.mangaId);
            let lastChapterComick = null;

            // Utiliser le service de détection de chapitres
            if (info?.title && m.mangaId) {
              try {
                const result = await detectChapters(m.mangaId, info.title);
                if (result) {
                  lastChapterComick = result.chapter;

                  // Mettre à jour la watchlist
                  api.patch('/api/watchlist/last-chapter', {
                    mangaId: m.mangaId,
                    lastChapterComick: result.chapter,
                  }, {
                    headers: {
                      Authorization: `Bearer ${token}`
                    }
                  }).catch(e => {
                    console.error('[WATCHLIST] PATCH failed:', e);
                  });
                }
              } catch (e) {
                console.error('[WATCHLIST] Chapter detection failed:', e);
              }
            }

            return { ...m, ...info, lastChapterComick, loading: false };
          } catch (e) {
            console.error(`[WATCHLIST] Fetch manga info failed for ${m.mangaId}:`, e);
            return { ...m, loading: false };
          }
        })
      );

      setDetailed(details);
      setHasData(details.length > 0);
      setLastLoadTime(Date.now());
    } catch (error: any) {
      console.error('[WATCHLIST] Load watchlist failed:', error);
      setError(error?.message || 'Erreur de chargement');
      setDetailed([]);
      setHasData(false);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleDeletePress = useCallback((manga: any) => {
    setMangaToDelete(manga);
    setDeleteModalVisible(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!mangaToDelete || !token) return;

    setDeleting(true);
    try {
      console.log('[WATCHLIST] Deleting manga:', mangaToDelete.mangaId);

      // Supprimer de la watchlist
      console.log('[WATCHLIST] Attempting to delete manga from watchlist:', mangaToDelete.mangaId);
      const watchlistResponse = await api.delete('/api/watchlist', {
        data: { mangaId: mangaToDelete.mangaId },
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('[WATCHLIST] Watchlist delete response:', watchlistResponse.data);

      // Supprimer la progression de lecture
      console.log('[WATCHLIST] Attempting to delete manga from reading progress:', mangaToDelete.mangaId);
      const progressResponse = await api.delete(`/api/reading-progress/${mangaToDelete.mangaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('[WATCHLIST] Progress delete response:', progressResponse.data);

      // Vérifier que les suppressions ont réussi
      if (watchlistResponse.status !== 200) {
        throw new Error('Failed to delete from watchlist');
      }
      if (progressResponse.status !== 200) {
        console.warn('[WATCHLIST] Progress deletion may have failed, but continuing...');
      }

      // Vérifier que la suppression a bien fonctionné en récupérant les données
      console.log('[WATCHLIST] Verifying deletion by checking watchlist...');
      const verifyWatchlist = await api.get('/api/watchlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const stillInWatchlist = verifyWatchlist.data.find((m: any) => m.mangaId === mangaToDelete.mangaId);
      if (stillInWatchlist) {
        console.error('[WATCHLIST] Manga still exists in watchlist after deletion!');
      } else {
        console.log('[WATCHLIST] Manga successfully removed from watchlist');
      }

      console.log('[WATCHLIST] Verifying deletion by checking reading progress...');
      const verifyProgress = await api.get('/api/reading-progress', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const stillInProgress = verifyProgress.data.data?.find((p: any) => p.mangaId === mangaToDelete.mangaId);
      if (stillInProgress) {
        console.error('[WATCHLIST] Manga still exists in reading progress after deletion!');
      } else {
        console.log('[WATCHLIST] Manga successfully removed from reading progress');
      }

      // Mettre à jour la liste locale
      setDetailed(prev => {
        const newDetailed = prev.filter(item => item.mangaId !== mangaToDelete.mangaId);
        console.log('[WATCHLIST] Updated detailed list length:', newDetailed.length);
        setHasData(newDetailed.length > 0);
        return newDetailed;
      });

      setDeleteModalVisible(false);
      setMangaToDelete(null);
      
      // Recharger la liste pour s'assurer que tout est synchronisé
      setTimeout(() => {
        console.log('[WATCHLIST] Reloading data after deletion...');
        load();
      }, 1000);

      // Notifier les autres écrans qu'une suppression a eu lieu
      // Cela forcera le rechargement des données de progression de lecture
      console.log('[WATCHLIST] Deletion completed, other screens should refresh their data');
      
      // Attendre un peu plus longtemps pour s'assurer que la suppression est bien propagée
      setTimeout(() => {
        console.log('[WATCHLIST] Final verification after deletion...');
        // Vérifier une dernière fois que la suppression a bien fonctionné
        api.get('/api/reading-progress', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(response => {
          const stillExists = response.data.data?.find((p: any) => p.mangaId === mangaToDelete.mangaId);
          if (stillExists) {
            console.error('[WATCHLIST] FINAL CHECK: Manga still exists in reading progress!');
          } else {
            console.log('[WATCHLIST] FINAL CHECK: Manga successfully removed from reading progress');
          }
        }).catch(error => {
          console.error('[WATCHLIST] Error during final verification:', error);
        });
      }, 2000);
    } catch (error: any) {
      console.error('[WATCHLIST] Delete failed:', error);
      console.error('[WATCHLIST] Error response:', error.response?.data);
      Alert.alert('Erreur', 'Impossible de supprimer le manga. Veuillez réessayer.');
    } finally {
      setDeleting(false);
    }
  }, [mangaToDelete, token, load]);

  const handleCancelDelete = useCallback(() => {
    setDeleteModalVisible(false);
    setMangaToDelete(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (ready && isAuthenticated) {
        // Éviter de recharger si on vient de supprimer un élément
        const timeSinceLastLoad = Date.now() - lastLoadTime;
        if (timeSinceLastLoad > 2000) { // 2 secondes minimum entre les rechargements
          load();
        }
      }
    }, [isAuthenticated, ready, load, lastLoadTime])
  );

  // Animation d'entrée pour les items
  useEffect(() => {
    if (!loading && detailed.length > 0) {

      // Animation simple et rapide
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Initialiser et animer les items
      itemAnimations.length = 0;
      detailed.forEach(() => {
        itemAnimations.push(new Animated.Value(0));
      });

      // Animer chaque item avec un délai
      itemAnimations.forEach((anim, index) => {
        Animated.sequence([
          Animated.delay(index * 50),
          Animated.timing(anim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else if (!loading && detailed.length === 0) {
      // Animation pour l'état vide
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, detailed.length]);

  if (!ready) return null;

  // Afficher un message d'erreur si il y en a un
  if (error && !loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <View style={styles.container}>
          {/* <View style={styles.headerContainer}>
            <Logo size="medium" />
          </View> */}
          <View style={styles.errorContainer}>
            <Card variant="outlined" style={styles.errorCard}>
              <View style={[styles.errorIcon, { backgroundColor: colors.error + '20' }]}>
                <Text style={[styles.errorIconText, { color: colors.error }]}>⚠️</Text>
              </View>
              <Text style={[styles.errorTitle, { color: colors.text }]}>Erreur de chargement</Text>
              <Text style={[styles.errorMessage, { color: colors.muted }]}>{error}</Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={load}
                activeOpacity={0.8}
              >
                <Text style={[styles.retryButtonText, { color: colors.background }]}>
                  Réessayer
                </Text>
              </TouchableOpacity>
            </Card>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
          <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.headerContainer}>
          {/* <Logo size="large" /> */}
          {/* <Text style={[styles.subtitle, { color: colors.muted }]}>
            {Brand.tagline}
          </Text> */}
        </View>

        {loading ? (
          <View>
            {Array.from({ length: 6 }, (_, i) => (
              <Animated.View
                key={`skeleton-${i}`}
                style={{
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }}
              >
                <Card variant="default">
                  <View style={styles.row}>
                    <View style={[styles.skeletonCover, { backgroundColor: colors.border }]} />
                    <View style={styles.skeletonInfo}>
                      <View style={[styles.skeletonTitle, { backgroundColor: colors.border }]} />
                      <View style={[styles.skeletonAuthor, { backgroundColor: colors.border }]} />
                      <View style={[styles.skeletonProgressBar, { backgroundColor: colors.border }]} />
                    </View>
                  </View>
                </Card>
              </Animated.View>
            ))}
          </View>
        ) : (
          <View>
            {detailed.length === 0 ? (
              <Animated.View
                style={[
                  styles.emptyContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                  }
                ]}
              >
                <Card variant="outlined" style={styles.emptyCard}>
                  <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.emptyIconText, { color: colors.primary }]}>📚</Text>
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun manga suivi</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                    Commencez à suivre vos mangas préférés pour les retrouver ici
                  </Text>
                </Card>
              </Animated.View>
            ) : (
              detailed.map((item, index) => {

                const lastRead = item.lastRead ? parseFloat(item.lastRead) : 0;
                
                // Calculer la progression directement (pas de hook dans la boucle)
                let progressWidth = 0;
                let progressColors = { progressColor: '#6b7280', badgeColor: '#6b7280', textColor: '#6b7280' };
                let progressText = '0 / 0';
                
                if (item.lastChapterComick && item.lastChapterComick > 0) {
                  const progressPercent = lastRead / item.lastChapterComick;
                  
                  if (lastRead === 0) {
                    // Pas commencé : barre vide
                    progressWidth = 0;
                    progressColors = { progressColor: '#ef4444', badgeColor: '#ef4444', textColor: '#ef4444' };
                    progressText = `0 / ${item.lastChapterComick}`;
                  } else if (progressPercent >= 1.0) {
                    progressWidth = 100;
                    progressColors = { progressColor: '#22c55e', badgeColor: '#22c55e', textColor: '#22c55e' };
                    progressText = `${lastRead} / ${item.lastChapterComick}`;
                  } else if (progressPercent >= 0.7) {
                    progressWidth = Math.max(60, progressPercent * 90);
                    progressColors = { progressColor: '#22c55e', badgeColor: '#22c55e', textColor: '#22c55e' };
                    progressText = `${lastRead} / ${item.lastChapterComick}`;
                  } else if (progressPercent >= 0.4) {
                    progressWidth = Math.max(30, progressPercent * 80);
                    progressColors = { progressColor: '#fb923c', badgeColor: '#fb923c', textColor: '#fb923c' };
                    progressText = `${lastRead} / ${item.lastChapterComick}`;
                  } else {
                    progressWidth = Math.max(10, progressPercent * 100);
                    progressColors = { progressColor: '#ef4444', badgeColor: '#ef4444', textColor: '#ef4444' };
                    progressText = `${lastRead} / ${item.lastChapterComick}`;
                  }
                }

                const itemAnim = itemAnimations[index] || new Animated.Value(1); // Valeur par défaut à 1 pour affichage immédiat

                const renderRightActions = () => (
                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: colors.error }]}
                    onPress={() => handleDeletePress(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.deleteButtonText, { color: colors.background }]}>
                      Supprimer
                    </Text>
                  </TouchableOpacity>
                );

                console.log('progressWidth', progressWidth);


                return (
                  <View
                    key={item.mangaId || index}
                  >
                    <Swipeable
                      renderRightActions={renderRightActions}
                      rightThreshold={70}
                    >
                      <TouchableOpacity
                        style={styles.itemContainer}
                        activeOpacity={0.7}
                        onPress={() => { router.push(`/manga/${item.mangaId}`); }}
                      >
                        <Card variant="outlined" style={styles.item}>
                          <View style={styles.row}>

                            <View style={[styles.coverContainer, { backgroundColor: colors.border }]}>
                              {item.coverUrl ? (
                                <Image source={{ uri: item.coverUrl }} style={styles.coverImage} />
                              ) : (
                                <View style={[styles.coverPlaceholder, { backgroundColor: colors.border }]}>
                                  <Text style={[styles.coverPlaceholderText, { color: colors.muted }]}>📚</Text>
                                </View>
                              )}
                              <View style={[styles.coverOverlay, { backgroundColor: colors.primary + '20' }]} />
                            </View>
                            <View style={styles.infoContainer}>
                              {/* Badge avec le nombre de chapitres restants */}
                              {lastRead > 0 && (
                                <View style={styles.chaptersRemainingContainer}>
                                                                      <View style={(() => {
                                      const last = lastRead;
                                      const total = item.lastChapterComick;
                                      const progressPercent = last / total;

                                    let badgeColor = colors.primary;
                                    if (progressPercent >= 1.0) {
                                      badgeColor = '#22c55e'; // Vert quand à jour
                                    } else if (progressPercent >= 0.7) {
                                      badgeColor = '#22c55e'; // Vert comme la barre
                                    } else if (progressPercent >= 0.4) {
                                      badgeColor = '#fb923c'; // Orange clair comme la barre
                                    } else {
                                      badgeColor = '#ef4444'; // Rouge comme la barre
                                    }

                                    return {
                                      backgroundColor: badgeColor,
                                      paddingHorizontal: 8,
                                      paddingVertical: 4,
                                      borderRadius: 12,
                                      alignSelf: 'flex-start'
                                    };
                                  })()}>
                                    <Text style={{
                                      color: '#fff',
                                      fontSize: 12,
                                      fontWeight: '600'
                                    }}>
                                      {lastRead >= item.lastChapterComick
                                        ? "À jour"
                                        : `${item.lastChapterComick - lastRead}`
                                      }
                                    </Text>
                                  </View>
                                </View>
                              )}
                              <Text style={[styles.mangaTitle, { color: colors.text }]}>
                                {item.loading ? 'Chargement...' : (item.title || item.mangaTitle || 'Titre inconnu')}
                              </Text>
                              <Text style={[styles.author, { color: colors.muted }]}>
                                {item.loading ? '...' : (item.author || 'Auteur inconnu')}
                              </Text>
                              {!item.loading && item.lastChapterComick && (
                                <View style={styles.progressContainer}>
                                  <View style={styles.progressBarContainer}>
                                    <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                                                                              <View 
                                          style={[
                                            styles.progressBarFill, 
                                            { 
                                              width: `${Math.round(progressWidth)}%`,
                                              backgroundColor: progressColors.progressColor
                                            }
                                          ]}
                                        />
                                    </View>
                                    <Text style={[styles.progressText, { color: progressColors.textColor }]}>{progressText}</Text>
                                  </View>

                                </View>
                              )}
                            </View>
                          </View>
                        </Card>
                      </TouchableOpacity>
                    </Swipeable>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal de confirmation de suppression */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalIcon, { backgroundColor: colors.error + '20' }]}>
              <Text style={[styles.modalIconText, { color: colors.error }]}>🗑️</Text>
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Êtes-vous sûr ?
            </Text>
            <Text style={[styles.modalMessage, { color: colors.muted }]}>
              Cette action supprimera également {mangaToDelete?.title || mangaToDelete?.mangaTitle} de votre watchlist.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={handleCancelDelete}
                disabled={deleting}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: colors.error }]}
                onPress={handleConfirmDelete}
                disabled={deleting}
              >
                <Text style={[styles.confirmButtonText, { color: colors.background }]}>
                  {deleting ? 'Suppression...' : 'Supprimer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    minHeight: '100%',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
  },
  scrollContent: {
    paddingBottom: 24,
    flexGrow: 1,
    minHeight: '120%',
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
  mangaTitle: {
    fontSize: 17,
    fontWeight: "700",
    textTransform: "uppercase",
    flexShrink: 1,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  author: {
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 8,
    marginBottom: 2,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  chaptersRemainingContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  progressBarBg: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  progressBarFill: {
    height: 12,
    borderRadius: 6,
    width: '0%', // Valeur par défaut
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 48,
    textAlign: 'right',
  },
  skeletonCover: {
    width: 60,
    height: 85,
    borderRadius: 12,
    marginRight: 16,
  },
  skeletonInfo: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  skeletonTitle: {
    width: '70%',
    height: 18,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonAuthor: {
    width: '40%',
    height: 14,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonProgressBar: {
    width: '60%',
    height: 6,
    borderRadius: 3,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
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
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  itemContainer: {
    // marginBottom: 12,
  },
  item: {
    borderRadius: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  errorCard: {
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  errorIconText: {
    fontSize: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    // width: 70,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalIconText: {
    fontSize: 32,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#dc3545', // Couleur rouge pour la suppression
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
