import { useLocalSearchParams, useRouter } from 'expo-router';
import JSZip from 'jszip';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function ReaderScreen() {
  const { scanCode, mangaTitle, chapter } = useLocalSearchParams();
  const router = useRouter();
  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (scanCode) {
      loadScan(scanCode as string);
    }
  }, [scanCode]);

  const handleGoBack = () => {
    console.log("Back button pressed. Can go back:", router.canGoBack());
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback if there's no history, e.g., deep link
      router.replace('/(tabs)/latest'); 
    }
  };

  const loadScan = async (code: string) => {
    setLoading(true);
    setError('');
    setProgress('Tentative de téléchargement...');

    try {
      console.log(`Tentative de téléchargement du scan: ${code}`);
      
      // URL de téléchargement
      const downloadUrl = `https://mangamoins.shaeishu.co/download/?scan=${code}`;
      
      // Essayer différents proxies pour contourner les restrictions CORS
      const proxies = [
        downloadUrl, // URL directe
        `https://corsproxy.io/?${encodeURIComponent(downloadUrl)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(downloadUrl)}`,
        `https://thingproxy.freeboard.io/fetch/${downloadUrl}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(downloadUrl)}`
      ];

      let response = null;
      let proxyUsed = '';
      let downloadSuccess = false;

      for (const proxy of proxies) {
        try {
          setProgress(`Tentative avec: ${proxy.split('/')[2] || 'URL directe'}`);
          console.log(`Tentative avec: ${proxy}`);

          response = await fetch(proxy, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/zip, application/octet-stream, */*',
              'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
            }
          });

          if (response.ok) {
            proxyUsed = proxy.split('/')[2] || 'URL directe';
            downloadSuccess = true;
            break;
          }
        } catch (err) {
          console.log(`Échec avec ${proxy}:`, err);
          continue;
        }
      }

      if (downloadSuccess && response) {
        // Vérifier que c'est bien un fichier ZIP ou un contenu binaire
        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');
        
        console.log('Proxy utilisé:', proxyUsed);
        console.log('Type de contenu:', contentType);
        console.log('Taille du fichier:', contentLength, 'bytes');

        setProgress('Décompression du ZIP...');
        
        // Récupérer le contenu du ZIP
        const arrayBuffer = await response.arrayBuffer();
        const zip = new JSZip();
        
        // Charger le ZIP
        const zipContent = await zip.loadAsync(arrayBuffer);
        console.log('ZIP chargé, fichiers trouvés:', Object.keys(zipContent.files));
        
        // Extraire les images PNG
        const imageFiles = Object.keys(zipContent.files).filter(filename => 
          /\.(png|jpg|jpeg|webp)$/i.test(filename)
        );
        
        console.log('Tous les fichiers dans le ZIP:', Object.keys(zipContent.files));
        console.log('Images trouvées (avant tri):', imageFiles);
        
        // Trier les images
        imageFiles.sort((a, b) => {
          // Trier par ordre numérique naturel
          const aMatch = a.match(/(\d+)/);
          const bMatch = b.match(/(\d+)/);
          const aNum = aMatch ? parseInt(aMatch[1]) : 0;
          const bNum = bMatch ? parseInt(bMatch[1]) : 0;
          
          console.log(`Tri: ${a} (${aNum}) vs ${b} (${bNum})`);
          
          if (aNum !== bNum) {
            return aNum - bNum;
          }
          
          // Si les numéros sont identiques, trier par nom de fichier
          return a.localeCompare(b);
        });
        
        console.log('Images triées:', imageFiles);
        
        if (imageFiles.length > 0) {
          setProgress(`Extraction de ${imageFiles.length} images...`);
          
          // Convertir les images en URLs de données
          const imageUrls = [];
          for (let i = 0; i < imageFiles.length; i++) {
            const filename = imageFiles[i];
            console.log(`\n=== Extraction de l'image ${i + 1}: ${filename} ===`);
            const file = zipContent.files[filename];
            
            // Vérifier la taille du fichier
            console.log(`Fichier ${filename} trouvé dans le ZIP`);
            
            const blob = await file.async('blob');
            console.log(`Blob créé pour ${filename}:`, blob.size, 'bytes, type:', blob.type);
            
            // Convertir le blob en data URL pour avoir une URL unique
            const reader = new FileReader();
            const dataUrl = await new Promise<string>((resolve) => {
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            
            console.log(`Data URL créée pour ${filename}:`, dataUrl.substring(0, 50) + '...');
            console.log(`Hash de l'URL:`, dataUrl.substring(0, 100).split('').reduce((a, b) => a + b.charCodeAt(0), 0));
            
            // Ajouter un identifiant unique basé sur le nom de fichier et l'index
            const uniqueDataUrl = dataUrl + `#${filename}_${i}`;
            console.log(`URL unique finale:`, uniqueDataUrl.substring(0, 50) + '...');
            
            imageUrls.push(uniqueDataUrl);
            
            // Petit délai pour éviter les conflits
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          
          console.log('Images extraites:', imageUrls.length);
          
          // Vérifier que les URLs sont uniques
          const uniqueUrls = [...new Set(imageUrls)];
          if (uniqueUrls.length !== imageUrls.length) {
            console.warn('ATTENTION: URLs dupliquées détectées!');
            console.log('Nombre d\'URLs uniques:', uniqueUrls.length);
          } else {
            console.log('Toutes les URLs sont uniques ✓');
          }
          
          // Afficher les premiers caractères de chaque URL pour vérification
          imageUrls.forEach((url, index) => {
            console.log(`URL ${index + 1}:`, url.substring(0, 100) + '...');
          });
          
          setPages(imageUrls);
          setCurrentPage(0);
          setProgress('');
          
          Alert.alert(
            'Décompression réussie',
            `Le scan ${code} a été décompressé avec succès.\n\nProxy: ${proxyUsed}\nImages extraites: ${imageUrls.length}\n\nLes vraies images du manga sont maintenant affichées !`,
            [{ text: 'OK' }]
          );
          
          return; // Sortir de la fonction car on a réussi
        } else {
          console.log('Aucune image trouvée dans le ZIP');
        }
      }

      // Si on arrive ici, soit le téléchargement a échoué, soit aucune image trouvée
      console.log('Utilisation des pages simulées');
      Alert.alert(
        downloadSuccess ? 'Aucune image trouvée' : 'Téléchargement échoué',
        downloadSuccess 
          ? `Le fichier ${code} a été téléchargé mais aucune image PNG n'a été trouvée.\n\nAffichage des pages simulées.`
          : `Impossible de télécharger le fichier ${code}.\n\nRaison: Restrictions CORS ou serveur inaccessible.\n\nAffichage des pages simulées pour la démonstration.`,
        [{ text: 'OK' }]
      );

      // Dans tous les cas, générer des pages pour éviter l'écran noir
      const mockPages = generateMockPages(code);
      setPages(mockPages);
      setCurrentPage(0);
      setProgress('');
      
    } catch (err: any) {
      console.error('Erreur lors du téléchargement du scan:', err);
      
      // Même en cas d'erreur, générer des pages pour éviter l'écran noir
      const mockPages = generateMockPages(code);
      setPages(mockPages);
      setCurrentPage(0);
      setProgress('');
      
      setError('Téléchargement échoué, pages simulées affichées');
      Alert.alert(
        'Erreur de téléchargement',
        `Erreur: ${err.message}\n\nPages simulées affichées pour la démonstration.`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const generateMockPages = (code: string) => {
    // Générer des pages basées sur le code de scan pour plus de réalisme
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#FF9F43', '#54A0FF'];
    const numPages = Math.floor(Math.random() * 8) + 18; // 18-25 pages
    
    return Array.from({ length: numPages }, (_, index) => {
      const colorIndex = (code.length + index) % colors.length;
      const color = colors[colorIndex].replace('#', '');
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
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Téléchargement du scan...</Text>
          <Text style={styles.scanInfo}>{mangaTitle} - Chapitre {chapter}</Text>
          {progress && (
            <Text style={styles.progressText}>{progress}</Text>
          )}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => loadScan(scanCode as string)}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
        >
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
            const pageIndex = Math.round(event.nativeEvent.contentOffset.x / width);
            if (pageIndex !== currentPage) {
              setCurrentPage(pageIndex);
            }
          }}
          scrollEventThrottle={32} // Optimisé pour onScroll
        >
          {pages.map((page, index) => (
            <View key={index} style={styles.pageContainer}>
              <Image 
                source={{ uri: page }}
                style={styles.pageImage}
                resizeMode="contain"
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
            {pages.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.pageDot,
                  currentPage === index && styles.pageDotActive
                ]}
                onPress={() => goToPage(index)}
              >
                <Text style={[
                  styles.pageDotText,
                  currentPage === index && styles.pageDotTextActive
                ]}>
                  {index + 1}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingTop: 50, // Pour la barre de statut
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  pageInfo: {
    color: '#fff',
    fontSize: 14,
  },
  readerContainer: {
    flex: 1,
  },
  pageContainer: {
    width,
    height: height - 200, // Réserver de l'espace pour header et navigation
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageImage: {
    width: '100%',
    height: '100%',
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  navButton: {
    padding: 12,
    backgroundColor: '#333',
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#666',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pageSelector: {
    flex: 1,
    marginHorizontal: 16,
  },
  pageDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  pageDotActive: {
    backgroundColor: '#fff',
  },
  pageDotText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pageDotTextActive: {
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 16,
  },
  scanInfo: {
    color: '#ccc',
    fontSize: 14,
  },
  progressText: {
    color: '#4ECDC4',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    padding: 12,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 