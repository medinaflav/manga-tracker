import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { API_URL } from '@/utils/api';
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  StatusBar,
  Linking,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function ReaderScreen() {
  const { slug, mangaTitle, chapter } = useLocalSearchParams();
  const router = useRouter();
  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);

  // ⚠️ Si tu veux ajouter 'loadScan' en dépendance, il faut le déclarer avec useCallback
  useEffect(() => {
    if (slug && chapter) {
      setLoading(true);
      setError("");
      setProgress("Chargement des images...");
      fetch(`${API_URL}/api/reader/${encodeURIComponent(slug as string)}/${chapter as string}`)
        .then(res => res.json())
        .then(data => {
          console.log('API /api/reader response:', data);
          if (data.images && data.images.length > 0) {
            setPages(data.images);
            setProgress("");
          } else if (data.url) {
            setProgress("");
            Linking.openURL(data.url);
          } else {
            setError("Aucune image trouvée");
          }
        })
        .catch(() => setError("Erreur lors du chargement des images"))
        .finally(() => setLoading(false));
    }
  }, [slug, chapter]);

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback if there's no history, e.g., deep link
      router.replace("/(tabs)/latest");
    }
  };

  const loadScan = async (code: string) => {
    setLoading(true);
    setError("");
    setProgress("Chargement depuis le backend...");

    try {
      const { data } = await fetch(`${API_URL}/api/manga/scan?code=${encodeURIComponent(code)}`)
        .then(res => res.json());
      if (data && data.images && data.images.length > 0) {
        setPages(data.images);
        setCurrentPage(0);
        setProgress("");
        return;
      } else {
        throw new Error("Aucune image trouvée dans le scan");
      }
    } catch (err: any) {
      console.error("Erreur lors du téléchargement du scan:", err);
      const mockPages = generateMockPages(code);
      setPages(mockPages);
      setCurrentPage(0);
      setProgress("");
      setError("Téléchargement échoué, pages simulées affichées");
      Alert.alert(
        "Erreur de téléchargement",
        `Erreur: ${err.message}\n\nPages simulées affichées pour la démonstration.`,
        [{ text: "OK" }],
      );
    } finally {
      setLoading(false);
    }
  };

  const generateMockPages = (code: string) => {
    // Générer des pages basées sur le code de scan pour plus de réalisme
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
      "#FF9F43",
      "#54A0FF",
    ];
    const numPages = Math.floor(Math.random() * 8) + 18; // 18-25 pages

    return Array.from({ length: numPages }, (_, index) => {
      const colorIndex = (code.length + index) % colors.length;
      const color = colors[colorIndex].replace("#", "");
      const pageNumber = index + 1;
      const text = `${code} - Page ${pageNumber}`;
      return `https://via.placeholder.com/800x1200/${color}/FFFFFF?text=${encodeURIComponent(text)}`;
    });
  };

  const goToPage = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < pages.length && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: pageIndex * width,
        animated: true,
      });
      // La mise à jour de currentPage se fera via l'événement onScroll
    }
  };

  const goToNextPage = () => {
    const nextPage = currentPage + 1;
    if (nextPage < pages.length) {
      goToPage(nextPage);
    }
  };

  const goToPreviousPage = () => {
    const prevPage = currentPage - 1;
    if (prevPage >= 0) {
      goToPage(prevPage);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#222' }}>
        <StatusBar barStyle="light-content" backgroundColor="#222" />
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Téléchargement du scan...</Text>
            <Text style={styles.scanInfo}>
              {mangaTitle} - Chapitre {chapter}
            </Text>
            {progress && <Text style={styles.progressText}>{progress}</Text>}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#222' }}>
        <StatusBar barStyle="light-content" backgroundColor="#222" />
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => loadScan(slug as string)}
            >
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#222' }}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {mangaTitle} - Chapitre {chapter}
          </Text>
          <Text style={styles.pageInfo}>
            {currentPage + 1} / {pages.length}
          </Text>
        </View>

        <View style={styles.readerContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => {
              const pageIndex = Math.round(
                event.nativeEvent.contentOffset.x / width,
              );
              if (pageIndex !== currentPage) {
                setCurrentPage(pageIndex);
              }
            }}
            scrollEventThrottle={32} // Optimisé pour onScroll
          >
            {pages.filter(page => page && typeof page === 'string' && !/^[. ]+$/.test(page)).map((page, index) => {
              const imageUrl = page.startsWith('/downloads') ? `${API_URL}${page}` : page;
              console.log('Image URL:', imageUrl);
              return (
                <View key={index} style={styles.pageContainer}>
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.pageImage}
                    resizeMode="contain"
                  />
                </View>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.navigation}>
          <TouchableOpacity
            style={[
              styles.navButton,
              currentPage === 0 && styles.navButtonDisabled,
            ]}
            onPress={goToPreviousPage}
            disabled={currentPage === 0}
          >
            <Text style={styles.navButtonText}>Précédent</Text>
          </TouchableOpacity>

          <View style={styles.pageSelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {pages.map((_, index) => {
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.pageDot,
                      currentPage === index && styles.pageDotActive,
                    ]}
                    onPress={() => goToPage(index)}
                  >
                    <Text
                      style={[
                        styles.pageDotText,
                        currentPage === index && styles.pageDotTextActive,
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <TouchableOpacity
            style={[
              styles.navButton,
              currentPage === pages.length - 1 && styles.navButtonDisabled,
            ]}
            onPress={goToNextPage}
            disabled={currentPage === pages.length - 1}
          >
            <Text style={styles.navButtonText}>Suivant</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#222",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingTop: 50, // Pour la barre de statut
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  pageInfo: {
    color: "#fff",
    fontSize: 14,
  },
  readerContainer: {
    flex: 1,
  },
  pageContainer: {
    width,
    height: height - 200, // Réserver de l'espace pour header et navigation
    justifyContent: "center",
    alignItems: "center",
  },
  pageImage: {
    width: "100%",
    height: "100%",
  },
  navigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  navButton: {
    padding: 12,
    backgroundColor: "#333",
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  navButtonDisabled: {
    backgroundColor: "#666",
  },
  navButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  pageSelector: {
    flex: 1,
    marginHorizontal: 16,
  },
  pageDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  pageDotActive: {
    backgroundColor: "#fff",
  },
  pageDotText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  pageDotTextActive: {
    color: "#222",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 16,
  },
  scanInfo: {
    color: "#ccc",
    fontSize: 14,
  },
  progressText: {
    color: "#4ECDC4",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    padding: 12,
    backgroundColor: "#333",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
