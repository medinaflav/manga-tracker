import { api } from '@/utils/api';
import { searchMangaByTitle } from '@/utils/mangadex';
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";


const POPULAR_TITLES = [
  "One Piece",
  "Kagurabachi",
  "Boruto: Two Blue Vortex",
  "Jujutsu Kaisen",
  "Solo Leveling",
  "Spy x Family",
];


// Ajoute une fonction utilitaire pour extraire l'URL de couverture d'un manga Mangadex
function getCoverUrlFromManga(manga: any): string | null {
  if (!manga) return null;
  const coverFileName = manga?.relationships?.find((r: any) => r.type === "cover_art")?.attributes?.fileName;
  return coverFileName
    ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFileName}.256.jpg`
    : null;
}

function getNumColumns() {
  const width = Dimensions.get("window").width;  
  if (width > 650) return 5;
  if (width > 450) return 4;
  if (width > 389) return 3;
  return 2;
}

export const options = { headerShown: false };

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [popular, setPopular] = useState<any[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [numColumns, setNumColumns] = useState(getNumColumns());
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    setLoadingPopular(true);
    Promise.all(POPULAR_TITLES.map(searchMangaByTitle)).then((arr) => {
      if (!cancelled) {
        setPopular(arr.filter(Boolean));
        setLoadingPopular(false);
      }
    });
    const onChange = () => setNumColumns(getNumColumns());
    const subscription = Dimensions.addEventListener("change", onChange);
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    api.get('/api/manga/search', { params: { q: query } })
      .then(({ data }) => {
        // Ajoute coverUrl à chaque résultat
        const mapped = (data.data || []).map((manga: any) => ({
          ...manga,
          coverUrl: getCoverUrlFromManga(manga),
          title: manga.attributes?.title?.en || Object.values(manga.attributes?.title || {})[0] || "Sans titre",
        }));
        setResults(mapped);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="Titre du manga"
            placeholderTextColor="#888"
            value={query}
            onChangeText={setQuery}
          />
        </View>
        {query ? (
          loading ? (
            <Text>Recherche...</Text>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              numColumns={numColumns}
              key={`results-grid-${numColumns}`}
              contentContainerStyle={styles.popularGrid}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.popularItem} activeOpacity={0.85} onPress={() => router.push(`/manga/${item.id}` as any)}>
                  {item.coverUrl ? (
                    <Image source={{ uri: item.coverUrl }} style={styles.popularCover} />
                  ) : (
                    <View style={styles.popularCoverPlaceholder}><Text>IMG</Text></View>
                  )}
                  <Text style={styles.popularTitle} numberOfLines={1}>{item.title}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={!loading ? <Text style={{ textAlign: 'center', marginTop: 32 }}>Aucun résultat</Text> : null}
            />
          )
        ) : (
          <>
            <Text style={styles.sectionTitle}>Les plus recherchés</Text>
            {loadingPopular ? (
              <Text>Chargement...</Text>
            ) : (
              <FlatList
                data={popular}
                keyExtractor={(item) => item.id}
                numColumns={numColumns}
                key={`popular-grid-${numColumns}`}
                scrollEnabled={false}
                contentContainerStyle={styles.popularGrid}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.popularItem} activeOpacity={0.85} onPress={() => router.push(`/manga/${item.id}` as any)}>
                    {item.coverUrl ? (
                      <Image source={{ uri: item.coverUrl }} style={styles.popularCover} />
                    ) : (
                      <View style={styles.popularCoverPlaceholder}><Text>IMG</Text></View>
                    )}
                    <Text style={styles.popularTitle} numberOfLines={1}>{item.title}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 32,
    minHeight: '100%',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff'
  },
  searchRow: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 8,
    marginTop: 8,
    marginHorizontal: 2,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fafbfc',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 18,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  popularGrid: {
    marginBottom: 24,
    gap: 12,
    paddingBottom: 12,
  },
  popularItem: {
    flex: 1,
    alignItems: "center",
    marginBottom: 18,
    minWidth: 110,
    maxWidth: 160,
    paddingHorizontal: 4,
  },
  popularCover: {
    width: 110,
    height: 155,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: "#eee",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  popularCoverPlaceholder: {
    width: 110,
    height: 155,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  popularTitle: {
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 2,
    letterSpacing: 0.1,
  },
  item: {
    paddingVertical: 8,
  },
});
