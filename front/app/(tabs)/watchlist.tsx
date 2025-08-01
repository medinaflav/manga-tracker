import { useState, useCallback } from 'react';
import { api } from '@/utils/api';
import { getLastChapter } from '@/utils/comick';
import { getMangaDetailsById } from '@/utils/mangadex';
import { FlatList, StyleSheet, Text, View, SafeAreaView, StatusBar, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';


// Récupère les infos détaillées d'un manga depuis MangaDex
export default function WatchlistScreen() {
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();
  const ready = useAuthRedirect();
  const [detailed, setDetailed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/watchlist');
      const details = await Promise.all(
        data.map(async (m: any) => {
          const info = await getMangaDetailsById(m.mangaId);
          let lastChapterComick = null;
          try {
            lastChapterComick = await getLastChapter(info?.title || m.title);
            if (lastChapterComick && m.mangaId) {
              try {
                await api.patch('/api/watchlist/last-chapter', { mangaId: m.mangaId, lastChapterComick });
              } catch (e) {
                console.error('[DEBUG] PATCH lastChapterComick failed:', e);
              }
            }
          } catch (e) {
            console.error('[DEBUG] Comick search failed:', e);
          }
          return { ...m, ...info, lastChapterComick };
        })
      );
      setDetailed(details);
    } catch {
      setDetailed([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (ready && isAuthenticated) {
        load();
      }
    }, [isAuthenticated, ready, load])
  );

  if (!ready) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        <Text style={styles.header}>Mes mangas</Text>
        {loading ? (
          <View style={styles.center}><Text>Chargement...</Text></View>
        ) : (
          <FlatList
            data={detailed}
            keyExtractor={(item) => item.mangaId || item.mangaId}
            renderItem={({ item }) => {
              let progress = 0;
              let progressText = '';
              item.lastRead = item.lastRead ? parseFloat(item.lastRead) : 0;

              if (item.lastChapterComick) {
                const last = parseFloat(item.lastRead);
                const total = parseFloat(item.lastChapterComick);
                if (!isNaN(total) && total > 0) {
                  progress = Math.min(last / total, 1);
                  progressText = `${item.lastRead} / ${item.lastChapterComick}`;
                }
              }
              return (
                <TouchableOpacity
                  style={styles.item}
                  activeOpacity={0.85}
                  onPress={() => { router.push(`/manga/${item.mangaId}`); }}
                >
                  <View style={styles.row}>
                    <View style={styles.coverContainer}>
                      {item.coverUrl ? (
                        <Image source={{ uri: item.coverUrl }} style={styles.coverImage} />
                      ) : (
                        <View style={styles.coverPlaceholder}>
                          <Text style={styles.coverPlaceholderText}>IMG</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.infoContainer}>
                      <Text style={styles.mangaTitle}>{item.title}</Text>
                      <Text style={styles.author}>{item.author}</Text>
                      {item.lastChapterComick && (
                        <View style={styles.progressBarContainer}>
                          <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%` }]} />
                          </View>
                          <Text style={styles.progressText}>{progressText}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={<View style={styles.center}><Text style={{ textAlign: 'center', marginTop: 32 }}>Aucun manga suivi</Text></View>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 15,
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 24,
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
  chapterNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#3b82f6",
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  author: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  progressBarContainer: {
    marginTop: 6,
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 12,
    color: '#222',
    minWidth: 48,
    textAlign: 'right',
  },
});
