import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { API_URL, api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { WebView } from 'react-native-webview';
import { Platform } from 'react-native';
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
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function ReaderScreen() {
  const { slug, mangaTitle, chapter, page, scanCode } = useLocalSearchParams();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const { token } = useAuth();

  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [redirected, setRedirected] = useState(false);
  const [webviewUrl, setWebviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (scanCode) {
      // Mode MangaMoins - utiliser le code de scan
      setLoading(true);
      setError('');
      setProgress('Chargement des images...');
      
      // Générer des pages mock pour le moment
      const mockPages = generateMockPages(scanCode as string);
      setPages(mockPages);
      setProgress('');
      setCurrentPage(0);
      setLoading(false);
    } else if (slug && chapter) {
      // Mode normal - utiliser slug et chapter
      setLoading(true);
      setError('');
      setProgress('Chargement des images...');
      fetch(`${API_URL}/api/reader/${encodeURIComponent(slug as string)}/${chapter as string}`)
        .then(res => res.json())
        .then(data => {
          if (data.images && data.images.length > 0) {
            setPages(data.images);
            setProgress('');
            // Si un paramètre page est présent, on l'utilise
            if (page && !isNaN(Number(page))) {
              const p = Math.max(0, Math.min(Number(page) - 1, data.images.length - 1));
              setCurrentPage(p);
              setTimeout(() => {
                if (scrollViewRef.current) {
                  scrollViewRef.current.scrollTo({ x: p * width, animated: false });
                }
              }, 100);
            } else {
              setCurrentPage(0);
            }
          } else if (data.url) {
            setProgress('');
            setWebviewUrl(data.url);
          } else {
            setError('Aucune image trouvée');
          }
        })
        .catch(() => setError('Erreur lors du chargement des images'))
        .finally(() => setLoading(false));
    }
  }, [slug, chapter, scanCode]);

  // Enregistrer la progression de lecture à la sortie du reader ou changement de manga/chapter
  useEffect(() => {
    return () => {
      if (token && ((slug && chapter) || scanCode)) {
        // Si aucune page n'a été affichée (pas d'images), on enregistre page: 0
        const shouldSavePage = Array.isArray(pages) && pages.length > 0;
        const pageToSave = shouldSavePage ? currentPage + 1 : 0;
        
        const mangaId = scanCode || slug;
        const chapterId = scanCode ? scanCode : chapter;
        const mangaTitleToSave = mangaTitle || mangaId;
        
        console.log('Sauvegarde progression:', { mangaId, chapterId, page: pageToSave, mangaTitle: mangaTitleToSave });
        
        api.post('/api/reading-progress', {
          mangaId: mangaId,
          mangaTitle: mangaTitleToSave,
          chapterId: chapterId,
          page: pageToSave,
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }).then(() => {
          console.log('Progression sauvegardée avec succès');
        }).catch((err) => {
          console.error('Erreur enregistrement progression:', err);
        });
      }
    };
  }, [slug, chapter, scanCode, currentPage, pages, mangaTitle, token]);

  const handleGoBack = useCallback(() => {
    // Sauvegarder la progression avant de quitter
    if (token && ((slug && chapter) || scanCode)) {
      const shouldSavePage = Array.isArray(pages) && pages.length > 0;
      const pageToSave = shouldSavePage ? currentPage + 1 : 0;
      
      const mangaId = scanCode || slug;
      const chapterId = scanCode ? scanCode : chapter;
      const mangaTitleToSave = mangaTitle || mangaId;
      
      api.post('/api/reading-progress', {
        mangaId: mangaId,
        mangaTitle: mangaTitleToSave,
        chapterId: chapterId,
        page: pageToSave,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).then(() => {
        console.log('Progression sauvegardée (sortie):', pageToSave);
      }).catch((err) => {
        console.error('Erreur enregistrement progression (sortie):', err);
      });
    }
    
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/latest');
    }
  }, [router, slug, chapter, token, pages, currentPage, mangaTitle]);

  const loadScan = useCallback(async (code: string) => {
    setLoading(true);
    setError('');
    setProgress('Chargement depuis le backend...');

    try {
      const res = await fetch(`${API_URL}/api/manga/scan?code=${encodeURIComponent(code)}`);
      const { data } = await res.json();
      if (data?.images?.length) {
        setPages(data.images);
        setCurrentPage(0);
        setProgress('');
        return;
      }
      throw new Error('Aucune image trouvée dans le scan');
    } catch (err: any) {
      console.error('Erreur lors du téléchargement du scan:', err);
      const mockPages = generateMockPages(code);
      setPages(mockPages);
      setCurrentPage(0);
      setProgress('');
      setError('Téléchargement échoué, pages simulées affichées');
      Alert.alert(
        'Erreur de téléchargement',
        `Erreur: ${err.message}\n\nPages simulées affichées pour la démonstration.`,
        [{ text: 'OK' }],
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const generateMockPages = (code: string): string[] => {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
      '#98D8C8',
      '#F7DC6F',
      '#FF9F43',
      '#54A0FF',
    ];
    const numPages = Math.floor(Math.random() * 8) + 18; // 18-25 pages

    return Array.from({ length: numPages }, (_, index) => {
      const colorIndex = (code.length + index) % colors.length;
      const color = colors[colorIndex].replace('#', '');
      const pageNumber = index + 1;
      const text = `${code} - Page ${pageNumber}`;
      return `https://via.placeholder.com/800x1200/${color}/FFFFFF?text=${encodeURIComponent(text)}`;
    });
  };

  const saveProgress = useCallback(() => {
    if (slug && chapter && token) {
      const shouldSavePage = Array.isArray(pages) && pages.length > 0;
      const pageToSave = shouldSavePage ? currentPage + 1 : 0;
      
      api.post('/api/reading-progress', {
        mangaId: slug,
        mangaTitle: mangaTitle || slug,
        chapterId: chapter,
        page: pageToSave,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).then(() => {
        console.log('Progression sauvegardée (manuel):', pageToSave);
      }).catch((err) => {
        console.error('Erreur enregistrement progression (manuel):', err);
      });
    }
  }, [slug, chapter, token, pages, currentPage, mangaTitle]);

  const goToPage = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < pages.length && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: pageIndex * width, animated: true });
      // Sauvegarder la progression quand l'utilisateur change de page
      setTimeout(() => {
        setCurrentPage(pageIndex);
        saveProgress();
      }, 100);
    }
  };

  const goToNextPage = () => goToPage(currentPage + 1);
  const goToPreviousPage = () => goToPage(currentPage - 1);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#222" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Téléchargement du scan...</Text>
          <Text style={styles.scanInfo}>{`${mangaTitle} - Chapitre ${chapter}`}</Text>
          {progress ? <Text style={styles.progressText}>{progress}</Text> : null}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#222" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadScan(slug as string)}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (redirected) {
    return null;
  }

  if (webviewUrl) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#222' }}>
        <StatusBar barStyle="light-content" backgroundColor="#222" />
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => setWebviewUrl(null)}>
              <Text style={styles.backButtonText}>← Retour</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Lecture Sushiscan</Text>
          </View>
          {Platform.OS === 'web' ? (
            <iframe
              src={webviewUrl}
              style={{ flex: 1, width: '100%', height: '100%', border: 'none', background: '#222' }}
              title="Lecture Sushiscan"
            />
          ) : (
            <WebView
              source={{ uri: webviewUrl }}
              style={{ flex: 1 }}
              startInLoadingState
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  let imageURI = '';
  if (typeof pages[currentPage] === 'string') {
    imageURI = pages[currentPage].startsWith('/downloads')
      ? `${API_URL}${pages[currentPage]}`
      : pages[currentPage];
  }
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{`${mangaTitle} - Chapitre ${chapter}`}</Text>
          <Text style={styles.pageInfo}>{`${currentPage + 1} / ${pages.length}`}</Text>
        </View>
        <View style={styles.readerContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={({ nativeEvent }) => {
              const pageIndex = Math.round(nativeEvent.contentOffset.x / width);
              if (pageIndex !== currentPage) setCurrentPage(pageIndex);
            }}
            scrollEventThrottle={32}
          >
            {pages.map((pageUrl, index) => (
              <View key={index} style={styles.pageContainer}>
                <Image
                    source={{
                      uri: pageUrl.startsWith('/downloads')
                        ? `${API_URL}${pageUrl}`
                        : pageUrl,
                    }}
                    style={{ width: "100%", height: "100%", resizeMode: "contain" }}
                                      onLoad={() => {}}
                  onError={e => {}}
                  />
              </View>
            ))}
          </ScrollView>
        </View>
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.navButton, currentPage === 0 && styles.navButtonDisabled]}
            onPress={goToPreviousPage}
            disabled={currentPage === 0}
          >
            <Text style={styles.navButtonText}>Précédent</Text>
          </TouchableOpacity>
          <View style={styles.pageSelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {pages.map((_, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.pageDot, currentPage === idx && styles.pageDotActive]}
                  onPress={() => goToPage(idx)}
                >
                  <Text style={[styles.pageDotText, currentPage === idx && styles.pageDotTextActive]}>
                    {idx + 1}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <TouchableOpacity
            style={[styles.navButton, currentPage === pages.length - 1 && styles.navButtonDisabled]}
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
  safeArea: {
    flex: 1,
    backgroundColor: '#222',
  },
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
    resizeMode: "contain",
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
