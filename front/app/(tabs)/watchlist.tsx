import axios from "axios";
import { useEffect, useState } from "react";
import { Button, FlatList, StyleSheet, Text, View, SafeAreaView, StatusBar, TouchableOpacity, Image } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from "expo-router";
import React from "react";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

// Récupère les infos détaillées d'un manga depuis MangaDex
async function fetchMangaDexInfoById(mangaId: string) {
  try {
    const res = await axios.get(`${API_URL}/api/manga/mangadex/${mangaId}`);
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
      const chaptersRes = await axios.get(`${API_URL}/api/manga/mangadex/${mangaId}/chapters`);
      totalChapters = chaptersRes.data.totalChapters;
    } catch (e) {
      console.error('Erreur récupération totalChapters:', e);
    }
    return {
      id: mangaId,
      title: manga.attributes?.title?.en || Object.values(manga.attributes?.title || {})[0] || "Sans titre",
      author,
      coverUrl,
      totalChapters,
    };
  } catch (e) {
    console.error("Erreur MangaDex:", e);
    return null;
  }
}

// Ajoute cette fonction utilitaire pour récupérer le dernier chapitre Comick
async function fetchComickLastChapterByTitle(title: string): Promise<string | null> {
  try {
    const res = await axios.get(`https://api.comick.io/v1.0/search`, {
      params: { q: title, limit: 1 }
    });
    const manga = res.data?.[0];
    return manga?.last_chapter || null;
  } catch (e) {
    console.error('[DEBUG] Erreur recherche last_chapter Comick:', e);
    return null;
  }
}

export default function WatchlistScreen() {
  const { isAuthenticated, token, authLoaded } = useAuth();
  const router = useRouter();
  const [mangas, setMangas] = useState<any[]>([]);
  const [detailed, setDetailed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoaded) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    load();
  }, [isAuthenticated, authLoaded]);

  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated && authLoaded) {
        load();
      }
    }, [isAuthenticated, authLoaded])
  );

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/watchlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMangas(data);
      // Récupère les infos détaillées pour chaque manga
      const details = await Promise.all(
        data.map(async (m: any) => {
          const info = await fetchMangaDexInfoById(m.mangaId);
          // Récupère le numéro du dernier chapitre Comick côté frontend
          let lastChapterComick = null;
          try {
            const res = await axios.get('https://api.comick.io/v1.0/search', {
              params: { q: info?.title || m.title, limit: 1 }
            });
            lastChapterComick = res.data?.[0]?.last_chapter || null;
            
            // PATCH vers le backend pour stocker la valeur
            if (lastChapterComick && m.mangaId) {
              try {
                await axios.patch(`${API_URL}/api/watchlist/last-chapter`, {
                  mangaId: m.mangaId,
                  lastChapterComick
                }, {
                  headers: { Authorization: `Bearer ${token}` }
                });
              } catch (e) {
                console.error('[DEBUG] PATCH lastChapterComick failed:', e);
              }
            }
          } catch (e) {
            console.error('[DEBUG] Comick search failed:', e);
          }
          return {
            ...m,
            ...info,
            lastChapterComick,
          };
        })
      );
      setDetailed(details);
    } catch {
      setMangas([]);
      setDetailed([]);
    } finally {
      setLoading(false);
    }
  };

  if (!authLoaded) return null;

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

export function AccountScreen() {
  const { user, logout, isAuthenticated, authLoaded } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!authLoaded) return;
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, authLoaded]);
  if (!authLoaded) return null;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>Mon compte</Text>
        <Text style={{ fontSize: 16, marginBottom: 16 }}>Connecté en tant que <Text style={{ fontWeight: 'bold' }}>{user}</Text></Text>
        <TouchableOpacity onPress={async () => { await logout(); router.replace("/login"); }} style={{ backgroundColor: '#e11d48', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 32 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Déconnexion</Text>
        </TouchableOpacity>
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
