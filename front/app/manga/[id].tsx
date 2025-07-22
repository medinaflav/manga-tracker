import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, SafeAreaView, StatusBar } from "react-native";
import DropDownPicker from 'react-native-dropdown-picker';
import axios from "axios";
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export const options = { headerShown: false };

export default function MangaDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [manga, setManga] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [chapterItems, setChapterItems] = useState<{label: string, value: string}[]>([]);
  const [lastChapterComick, setLastChapterComick] = useState<string | null>(null);
  const [lastRead, setLastRead] = useState<string | null>(null);
  const [isFollowed, setIsFollowed] = useState(false);

  useEffect(() => {
    if (!id) return;
    axios.get(`${API_URL}/api/watchlist`)
      .then(({ data }) => {
        if (Array.isArray(data)) {
          const found = data.find((m: any) => m.mangaId === id || m.id === id);
          setIsFollowed(!!found);
          setLastRead(found?.lastRead || null);
        }
      })
      .catch(() => {
        setIsFollowed(false);
        setLastRead(null);
      });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axios.get(`https://api.mangadex.org/manga/${id}`, { params: { includes: ["cover_art", "author"] } })
      .then(async ({ data }) => {
        const mangaData = data.data;
        const coverRel = mangaData?.relationships?.find((r: any) => r.type === "cover_art");
        let coverUrl = null;
        if (coverRel?.attributes?.fileName) {
          coverUrl = `https://uploads.mangadex.org/covers/${id}/${coverRel.attributes.fileName}.256.jpg`;
        }
        setManga({
          ...mangaData,
          title: mangaData.attributes?.title?.en || Object.values(mangaData.attributes?.title || {})[0] || "Sans titre",
          description: mangaData.attributes?.description?.fr || mangaData.attributes?.description?.en || "",
          coverUrl,
          author: mangaData.relationships?.find((r: any) => r.type === "author")?.attributes?.name || "Auteur inconnu",
        });
      })
      .catch(() => setManga(null))
      .finally(() => setLoading(false));
  }, [id]);

  // Récupère le dernier chapitre Comick
  useEffect(() => {
    if (!manga?.title) return;
    (async () => {
      try {
        const res = await axios.get('https://api.comick.io/v1.0/search', {
          params: { q: manga.title, limit: 1 }
        });
        setLastChapterComick(res.data?.[0]?.last_chapter || null);
      } catch {
        setLastChapterComick(null);
      }
    })();
  }, [manga?.title]);

  // Dropdown chapitres (du plus grand au plus petit)
  useEffect(() => {
    if (!lastChapterComick) {
      setChapterItems([]);
      return;
    }
    const max = parseInt(lastChapterComick, 10);
    if (isNaN(max) || max <= 0) {
      setChapterItems([]);
      return;
    }
    setChapterItems(
      Array.from({ length: max }, (_, i) => ({
        label: `Chapitre ${max - i}`,
        value: (max - i).toString(),
      }))
    );
  }, [lastChapterComick]);

  useEffect(() => {
    if (lastRead && chapterItems.length > 0) {
      const next = (parseInt(lastRead, 10) + 1).toString();
      const exists = chapterItems.some(item => item.value === next);
      if (exists) setSelectedChapter(next);
    }
  }, [lastRead, chapterItems]);

  useEffect(() => {
    console.log("lastChapterComick (effect):", lastChapterComick);
  }, [lastChapterComick]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" /><Text>Chargement...</Text></View>;
  }
  if (!manga) {
    return <View style={styles.center}><Text>Manga introuvable</Text></View>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => {
            if (router.canGoBack && router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }}>
            <Ionicons name="arrow-back" size={26} color="#222" />
          </TouchableOpacity>
          {manga.coverUrl ? (
            <Image source={{ uri: manga.coverUrl }} style={styles.cover} />
          ) : (
            <View style={styles.coverPlaceholder}><Text>IMG</Text></View>
          )}
          <View style={styles.info}>
            <Text style={styles.title}>{manga.title}</Text>
            <Text style={styles.author}>{manga.author}</Text>
            {lastChapterComick ? (
              <Text style={styles.lastChapter}>Dernier chapitre : {lastChapterComick}</Text>
            ) : null}
            {lastRead && (
              <Text style={styles.lastRead}>
                Dernier scan lu : {lastRead}
              </Text>
            )}
            <TouchableOpacity
              style={[styles.followButton, { backgroundColor: isFollowed ? '#e5e7eb' : '#3b82f6' }]}
              onPress={async () => {
                try {
                  if (!isFollowed) {
                    await axios.post(`${API_URL}/api/watchlist`, { mangaId: id, title: manga?.title, lastRead });
                    setIsFollowed(true);
                  } else {
                    await axios.delete(`${API_URL}/api/watchlist`, { data: { mangaId: id } });
                    setIsFollowed(false);
                  }
                } catch {}
              }}
            >
              <Text style={{ color: isFollowed ? '#222' : '#fff', fontWeight: 'bold', fontSize: 15 }}>
                {isFollowed ? 'Suivi ✓' : 'Suivre'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      {/* <Text style={styles.description}>{manga.description}</Text> */}
      {lastChapterComick ? (
        <>
          <DropDownPicker
            open={open}
            value={selectedChapter}
            items={chapterItems}
            setOpen={setOpen}
            setValue={setSelectedChapter}
            setItems={setChapterItems}
            searchable={true}
            placeholder="Sélectionner un chapitre"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            listMode="SCROLLVIEW"
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: selectedChapter ? '#10b981' : '#ccc', marginRight: 8 }]}
              disabled={!selectedChapter}
              onPress={async () => {
                if (selectedChapter) {
                  try {
                    await axios.post(`${API_URL}/api/watchlist/lastread`, { mangaId: id, lastRead: selectedChapter });
                    setLastRead(selectedChapter);
                  } catch {}
                }
              }}
            >
              <Text style={styles.buttonText}>Lu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: selectedChapter ? '#3b82f6' : '#ccc', marginLeft: 8 }]}
              disabled={!selectedChapter}
              onPress={() => {
                if (selectedChapter) {
                  const url = `https://sushiscan.net/one-piece-volume-${selectedChapter}/`;
                  Linking.openURL(url);
                }
              }}
            >
              <Text style={styles.buttonText}>Lire</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <Text style={{ textAlign: 'center', marginTop: 16 }}>Aucun chapitre trouvé</Text>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 0,
    // backgroundColor: '#f7f7fa',
    minHeight: '100%',
    alignItems: 'center',
    paddingBottom: 32,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 24,
    marginBottom: 18,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.08,
    // shadowRadius: 8,
    // elevation: 2,
  },
  cover: {
    width: 170,
    height: 240,
    borderRadius: 16,
    backgroundColor: "#eee",
    marginBottom: 18,
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    width: 170,
    height: 240,
    borderRadius: 16,
    backgroundColor: "#eee",
    marginBottom: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    alignItems: 'center',
    width: '90%',
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: 'center',
    color: '#222',
  },
  author: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
    textAlign: 'center',
  },
  lastChapter: {
    fontSize: 15,
    // color: '#3b82f6',
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
  },
  lastRead: {
    color: '#3b82f6',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: "#333",
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 12,
    textAlign: 'center',
    color: '#222',
  },
  dropdown: {
    marginBottom: 16,
    zIndex: 100,
    borderRadius: 8,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    width: 250,
    alignSelf: 'center',
  },
  dropdownContainer: {
    zIndex: 200,
    borderRadius: 8,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    minWidth: 220,
    alignSelf: 'center',
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: 250,
    alignSelf: 'center',
    marginBottom: 12,
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  backButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  chapterItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  chapterTitle: {
    fontSize: 15,
    fontWeight: "500",
  },
  chapterLang: {
    fontSize: 12,
    color: "#888",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  followButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
}); 