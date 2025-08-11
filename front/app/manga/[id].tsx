import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, TextInput, Animated } from "react-native";
import axios from 'axios';
import { api } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';
import { API_URL } from '@/utils/api';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { useChapterDetection } from '@/hooks/useChapterDetection';

export const options = { headerShown: false };

// Ajout de la fonction slugify
function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD') // décompose les accents
    .replace(/[\u0300-\u036f]/g, '') // enlève les accents
    .replace(/×/g, 'x') // remplace le "×" par "x"
    .replace(/[^a-z0-9]+/g, '-') // remplace tout ce qui n'est pas alphanumérique par un tiret
    .replace(/^-+|-+$/g, '') // enlève les tirets en début/fin
    .replace(/--+/g, '-'); // remplace les doubles tirets par un seul
}

export default function MangaDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [manga, setManga] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [chapterItems, setChapterItems] = useState<{ label: string; value: string; source: string; scanCode?: string }[]>([]);
    const [lastChapterComick, setLastChapterComick] = useState<string | null>(null);
    const [mangamoinsChapters, setMangamoinsChapters] = useState<any[]>([]);
    const [lastRead, setLastRead] = useState<string | null>(null);
    const [isFollowed, setIsFollowed] = useState(false);
    const [dropdownAnimation] = useState(() => new Animated.Value(0));
    const [chevronAnimation] = useState(() => new Animated.Value(0));
    const [searchQuery, setSearchQuery] = useState('');
    const { detectChapters } = useChapterDetection();

    // Mémoriser les styles pour éviter les recalculs
    const dropdownStyles = useMemo(() => ({
        dropdown: {
            ...styles.dropdown,
            backgroundColor: colors.surface,
            height: 48,
            borderColor: colors.border,
            shadowColor: colors.shadow,
        },
        dropdownText: {
            ...styles.dropdownText,
            color: selectedChapter || lastRead ? colors.text : colors.muted,
            lineHeight: 48
        },
        dropdownItemRow: (index: number, isSelected: boolean) => ({
            ...styles.dropdownItemRow,
            backgroundColor: isSelected ? colors.dropdownSelected : colors.dropdownItem,
            borderBottomWidth: index === chapterItems.length - 1 ? 0 : 1,
            borderBottomColor: colors.border,
        }),
        dropdownItemLabel: (isSelected: boolean) => ({
            ...styles.dropdownItemLabel,
            color: isSelected ? colors.dropdownSelectedText : colors.dropdownItemText
        }),
        dropdownItemDate: {
            ...styles.dropdownItemDate,
            color: colors.muted,
        },
        noChapter: {
            ...styles.noChapter,
            color: colors.placeholder,
        },
        dropdownLabel: {
            ...styles.dropdownLabel,
            color: colors.text,
        },
        placeholderStyle: {
            ...styles.placeholderStyle,
            color: colors.placeholder,
        },
        selectedTextStyle: {
            ...styles.selectedTextStyle,
            color: colors.text,
        },
    }), [colors, selectedChapter, lastRead, chapterItems.length]);

    // Mémoriser le texte du dropdown
    const dropdownText = useMemo(() => {
        if (selectedChapter) return `Ch. ${selectedChapter}`;
        if (lastRead) return `Ch. ${lastRead}`;
        return `${chapterItems.length > 0 ? chapterItems.length : "-"} chapitres disponible`;
    }, [selectedChapter, lastRead, chapterItems.length]);

    // Callback pour ouvrir/fermer le dropdown
    const toggleDropdown = useCallback(() => {
        const newOpen = !open;
        setOpen(newOpen);
        
        // Animation pour la bordure et l'opacité (pas de driver natif)
        Animated.timing(dropdownAnimation, {
            toValue: newOpen ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
        
        // Animation pour le chevron (avec driver natif)
        Animated.timing(chevronAnimation, {
            toValue: newOpen ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [open, dropdownAnimation, chevronAnimation]);

    // Callback pour sélectionner un chapitre
    const selectChapter = useCallback((value: string) => {
        setSelectedChapter(value);
        setOpen(false);
        setSearchQuery(''); // Réinitialiser la recherche
        
        // Animation pour la bordure et l'opacité (pas de driver natif)
        Animated.timing(dropdownAnimation, {
            toValue: 0,
            duration: 150,
            useNativeDriver: false,
        }).start();
        
        // Animation pour le chevron (avec driver natif)
        Animated.timing(chevronAnimation, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
        }).start();
    }, [dropdownAnimation, chevronAnimation]);

    // Filtrer les chapitres selon la recherche
    const filteredChapterItems = useMemo(() => {
        if (!searchQuery.trim()) return chapterItems;
        return chapterItems.filter(item => 
            item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.value.includes(searchQuery)
        );
    }, [chapterItems, searchQuery]);

    // Mémoriser les éléments du dropdown
    const dropdownItems = useMemo(() => {
        return filteredChapterItems.map((item, index) => (
            <TouchableOpacity
                key={item.value}
                style={dropdownStyles.dropdownItemRow(index, selectedChapter === item.value)}
                onPress={() => selectChapter(item.value)}
                activeOpacity={0.7}
            >
                <Text style={dropdownStyles.dropdownItemLabel(selectedChapter === item.value)}>
                    {item.label}
                </Text>
            </TouchableOpacity>
        ));
    }, [filteredChapterItems, selectedChapter, dropdownStyles, selectChapter]);

    // Callback pour gérer la soumission de la recherche
    const handleSearchSubmit = useCallback(() => {
        if (filteredChapterItems.length > 0) {
            selectChapter(filteredChapterItems[0].value);
        }
    }, [filteredChapterItems, selectChapter]);

    // Fetch watchlist status
    useEffect(() => {
        if (!id) return;
        api.get('/api/watchlist')
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

    // Fetch manga details
    useEffect(() => {
        if (!id) return;
        setLoading(true);
        console.log('manga id ', id);
        axios.get(`https://api.mangadex.org/manga/${id}`, { params: { includes: ["cover_art", "author"] } })
            .then(({ data }) => {
                const mangaData = data.data;
                const coverRel = mangaData.relationships?.find((r: any) => r.type === "cover_art");
                let coverUrl = null;
                if (coverRel?.attributes?.fileName) {
                    coverUrl = `https://uploads.mangadex.org/covers/${id}/${coverRel.attributes.fileName}.512.jpg`;
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

    // Fetch latest chapters using the detection service
    useEffect(() => {
        if (!manga?.title || !id) return;
        
        (async () => {
            try {
                const result = await detectChapters(id as string, manga.title);
                if (result) {
                    setLastChapterComick(result.chapter);
                    
                    // Si MangaMoins a des chapitres, les stocker pour l'affichage
                    if (result.mangamoinsChapter) {
                        const mangamoinsData = await api.get('/api/mangamoins/latest');
                        const matchingChapters = mangamoinsData.data.filter((chapter: any) => 
                            chapter.manga.toLowerCase() === manga.title.toLowerCase() ||
                            chapter.manga.toLowerCase().includes(manga.title.toLowerCase()) ||
                            manga.title.toLowerCase().includes(chapter.manga.toLowerCase())
                        );
                        setMangamoinsChapters(matchingChapters);
                    }
                }
            } catch (error) {
                console.error("Erreur lors de la détection des chapitres:", error);
                setLastChapterComick(null);
                setMangamoinsChapters([]);
            }
        })();
    }, [manga?.title, id, detectChapters]);

    // Build chapter items
    useEffect(() => {
        const chapters = new Set<string>();
        const chapterItems: { label: string; value: string; source: string; scanCode?: string }[] = [];

        // Ajouter les chapitres de Comick
        if (lastChapterComick) {
            const max = parseInt(lastChapterComick, 10);
            if (!isNaN(max) && max > 0) {
                for (let i = 0; i < max; i++) {
                    const chapterNum = (max - i).toString();
                    chapters.add(chapterNum);
                    chapterItems.push({ 
                        label: `Ch. ${chapterNum}`, 
                        value: chapterNum,
                        source: 'comick'
                    });
                }
            }
        }

        // Ajouter les chapitres de MangaMoins (s'ils sont plus récents)
        let highestChapter = lastChapterComick ? parseInt(lastChapterComick, 10) : 0;
        
        mangamoinsChapters.forEach((chapter: any) => {
            const chapterNum = parseInt(chapter.chapter, 10);
            if (!isNaN(chapterNum)) {
                // Mettre à jour le chapitre le plus récent si nécessaire
                if (chapterNum > highestChapter) {
                    highestChapter = chapterNum;
                }
                
                if (!chapters.has(chapter.chapter)) {
                    chapters.add(chapter.chapter);
                    // Extraire le code de scan de l'URL
                    const scanCode = chapter.link.split("scan=")[1];
                    chapterItems.push({ 
                        label: `Ch. ${chapter.chapter} (MangaMoins)`, 
                        value: chapter.chapter,
                        source: 'mangamoins',
                        scanCode: scanCode
                    });
                }
            }
        });

        // Trier par numéro de chapitre (décroissant)
        chapterItems.sort((a, b) => parseInt(b.value) - parseInt(a.value));
        
        setChapterItems(chapterItems);
        
        // Mettre à jour lastChapterComick avec le chapitre le plus récent
        if (highestChapter > 0 && (!lastChapterComick || highestChapter > parseInt(lastChapterComick, 10))) {
            setLastChapterComick(highestChapter.toString());
            
            // Mettre à jour la base de données si le chapitre est plus récent
            if (highestChapter > parseInt(lastChapterComick || '0', 10)) {
                api.put(`/api/manga/${id}/last-chapter`, {
                    lastChapter: highestChapter.toString()
                }).then(() => {
                    console.log(`[MANGA-DETAIL] Updated lastChapter in database: ${highestChapter}`);
                }).catch((error) => {
                    console.error('[MANGA-DETAIL] Error updating lastChapter in database:', error);
                });
            }
        }
    }, [lastChapterComick, mangamoinsChapters]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
                <Text>Chargement...</Text>
            </View>
        );
    }
    if (!manga) {
        return (
            <View style={styles.center}>
                <Text>Manga introuvable</Text>
            </View>
        );
    }


    
    return (
        <View style={[styles.container]}>
            <StatusBar barStyle={'light-content'} backgroundColor={colors.background} translucent={true} />

            {/* Header avec couverture et boutons */}
            <View style={styles.coverWrapper}>
                {manga.coverUrl ? (
                    <Image source={{ uri: manga.coverUrl }} style={styles.coverImage} />
                ) : (
                    <View style={[styles.coverPlaceholder, { backgroundColor: colors.border }]}>
                        <Text style={[styles.coverPlaceholderText, { color: colors.muted }]}>📚</Text>
                    </View>
                )}
                
                {/* Boutons de navigation */}
                <View style={styles.headerButtons}>
                    <TouchableOpacity 
                        style={[styles.headerButton, { backgroundColor: colors.background}]} 
                        onPress={() => router.back()}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.headerButton, { backgroundColor: colors.background }]}
                        onPress={async () => {
                            try {
                                if (!isFollowed) {
                                    await api.post('/api/watchlist', { 
                                        mangaId: id, 
                                        title: manga.title, 
                                        lastRead,
                                        author: manga.author,
                                        coverUrl: manga.coverUrl,
                                        description: manga.description
                                    });
                                    setIsFollowed(true);
                                } else {
                                    await api.delete('/api/watchlist', { data: { mangaId: id } });
                                    setIsFollowed(false);
                                }
                            } catch { }
                        }}
                        activeOpacity={0.8}
                    >
                        <Ionicons 
                            name={isFollowed ? "book" : "book-outline"}
                            size={24} 
                            color={isFollowed ? "#e11d48" : colors.text} 
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Contenu principal */}
            <View style={styles.content}>
                {/* Informations du manga */}
                <View style={styles.mangaInfoCard}>
                    <Text style={[styles.title, { color: colors.text }]}>{manga.title}</Text>
                    <Text style={[styles.author, { color: colors.muted }]}>{manga.author}</Text>
                    
                    {lastRead !== undefined && (
                        <View style={styles.progressContainer}>
                            <View style={styles.progressRow}>
                                {Number(lastChapterComick) > 0 && (
                                    <View style={styles.progressBarContainer}>
                                        {(() => {
                                            const last = Number(lastRead);
                                            const total = Number(lastChapterComick);
                                            const remainingChapters = total - last;
                                            let progress = 0;
                                            let progressColor = colors.primary;
                                            
                                            const progressPercent = last / total;
                                            
                                            console.log(`remainingChapters: ${remainingChapters}, progressPercent: ${progressPercent}`  );
                                            
                                            if (last === 0) {
                                                // Pas commencé : barre vide
                                                progress = 0;
                                                progressColor = colors.progressNotStarted;
                                            } else if (progressPercent >= 1.0) {
                                                // À jour : barre pleine
                                                progress = 1.0;
                                                progressColor = colors.progressCompleted;
                                            } else if (progressPercent >= 0.7) {
                                                // 70% et plus : vert (proche de la fin)
                                                progress = Math.max(0.6, progressPercent * 0.9);
                                                progressColor = colors.progressAlmostDone;
                                            } else if (progressPercent >= 0.4) {
                                                // 40-70% : orange (milieu)
                                                progress = Math.max(0.3, progressPercent * 0.8);
                                                progressColor = colors.progressInProgress;
                                            } else {
                                                // Moins de 40% : rouge (début)
                                                const rawProgress = last / total;
                                                progress = Math.max(0.1, rawProgress);
                                                progressColor = colors.progressNotStarted;
                                            }
                                            
                                            return (
                                                <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                                                    <View 
                                                        style={[
                                                            styles.progressBarFill, 
                                                            { 
                                                                width: `${Math.round(progress * 100)}%`,
                                                                backgroundColor: progressColor
                                                            }
                                                        ]}
                                                    />
                                                </View>
                                            );
                                        })()}
                                    </View>
                                )}
                                                                <View style={(() => {
                                    const last = Number(lastRead);
                                    const total = Number(lastChapterComick);
                                    const remainingChapters = total - last;
                                    
                                    const progressPercent = last / total;
                                    
                                    let badgeColor = colors.primary;
                                    if (progressPercent >= 1.0) {
                                        badgeColor = colors.progressCompleted;
                                    } else if (progressPercent >= 0.7) {
                                        badgeColor = colors.progressAlmostDone;
                                    } else if (progressPercent >= 0.4) {
                                        badgeColor = colors.progressInProgress;
                                    } else {
                                        badgeColor = colors.progressNotStarted;
                                    }
                                    
                                    return {
                                        backgroundColor: badgeColor,
                                        paddingHorizontal: 12,
                                        paddingVertical: 6,
                                        borderRadius: 16,
                                        alignSelf: 'flex-start'
                                    };
                                })()}>
                                    <Text style={{
                                        color: '#fff',
                                        fontSize: 14,
                                        fontWeight: '600'
                                    }}>
                                        {Number(lastRead) === 0
                                            ? "Pas commencé"
                                            : Number(lastRead) === Number(lastChapterComick)
                                                ? "À jour"
                                                : `${lastRead} / ${lastChapterComick}`}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* Sélection de chapitre */}
                <View style={styles.chapterCard}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Sélectionner un chapitre</Text>
                    
                    <View style={styles.dropdownRow}>
                        <View style={styles.dropdownContainer}> 
                            <View style={{ position: 'relative', width: '100%' }}>
                                                                <Animated.View style={[
                                    dropdownStyles.dropdown,
                                    {
                                        borderColor: dropdownAnimation.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [colors.border, colors.primary]
                                        })
                                    }
                                ]}>
                                    {open ? (
                                        <TextInput
                                            style={[dropdownStyles.dropdownText, { 
                                                paddingHorizontal: 0,
                                                paddingVertical: 0,
                                                textAlignVertical: 'center',
                                                height: 48,
                                                lineHeight: 48,
                                                textAlign: 'left'
                                            }]}
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                            placeholder={dropdownText}
                                            placeholderTextColor={colors.muted}
                                            autoFocus={true}
                                            returnKeyType="search"
                                            clearButtonMode="while-editing"
                                            onSubmitEditing={handleSearchSubmit}
                                        />
                                    ) : (
                                        <TouchableOpacity
                                            style={{ flex: 1, justifyContent: 'center', height: 48 }}
                                            onPress={toggleDropdown}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={[dropdownStyles.dropdownText, { lineHeight: 48 }]}>
                                                {dropdownText}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </Animated.View>
                                <TouchableOpacity
                                    style={styles.dropdownArrow}
                                    onPress={toggleDropdown}
                                    activeOpacity={0.6}
                                    hitSlop={{ top: 10, bottom: 10, left: 0, right: 10 }}
                                >
                                    <Animated.View style={{
                                        transform: [{
                                            rotate: chevronAnimation.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0deg', '180deg']
                                            })
                                        }]
                                    }}>
                                        <Ionicons
                                            name="chevron-down"
                                            size={24}
                                            color={colors.muted}
                                        />
                                    </Animated.View>
                                </TouchableOpacity>
                            </View>
                            <Animated.View style={[
                                styles.dropdownMenu,
                                {
                                    opacity: dropdownAnimation,
                                    pointerEvents: open ? 'auto' : 'none',
                                    transform: [{
                                        translateY: dropdownAnimation.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [-10, 0]
                                        })
                                    }]
                                }
                            ]}>
                                <ScrollView 
                                    style={styles.dropdownList}
                                    nestedScrollEnabled={true}
                                    keyboardShouldPersistTaps="always"
                                    showsVerticalScrollIndicator={true}
                                    bounces={false}
                                    contentContainerStyle={styles.dropdownContent}
                                >
                                    {dropdownItems}
                                    {filteredChapterItems.length === 0 && searchQuery.trim() && (
                                        <View style={styles.noResultsContainer}>
                                            <Text style={[styles.noResultsText, { color: colors.muted }]}>
                                                Aucun chapitre trouvé
                                            </Text>
                                        </View>
                                    )}
                                </ScrollView>
                            </Animated.View>
                        </View>
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.iconButton, { 
                                    backgroundColor: selectedChapter ? colors.primary : colors.border,
                                    marginRight: 8 
                                }]}
                                disabled={!selectedChapter}
                                onPress={async () => {
                                    if (!manga?.title || !selectedChapter) return;
                                    
                                    // Trouver le chapitre sélectionné dans la liste
                                    const selectedChapterInfo = chapterItems.find(item => item.value === selectedChapter);
                                    
                                    if (selectedChapterInfo?.source === 'mangamoins' && selectedChapterInfo?.scanCode) {
                                        // Mode MangaMoins
                                        router.push({
                                            pathname: '/reader',
                                            params: {
                                                mangaTitle: manga.title,
                                                chapter: selectedChapter,
                                                scanCode: selectedChapterInfo.scanCode,
                                            },
                                        });
                                    } else {
                                        // Mode normal (Comick)
                                        const slug = slugify(manga.title);
                                        try {
                                            router.push({
                                                pathname: '/reader',
                                                params: {
                                                    mangaTitle: manga.title,
                                                    chapter: selectedChapter,
                                                    slug: slug,
                                                },
                                            });
                                        } catch (err) {
                                            const sushiSlug = manga.title
                                                .toLowerCase()
                                                .normalize('NFD')
                                                .replace(/×/g, 'x')
                                                .replace(/[\u0300-\u036f]/g, '')
                                                .replace(/[^a-z0-9]+/g, '-')
                                                .replace(/^-+|-+$/g, '')
                                                .replace(/--+/g, '-');
                                            const url = `https://sushiscan.net/${sushiSlug}-chapitre-${selectedChapter}/`;
                                            Linking.openURL(url);
                                        }
                                    }
                                }}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="book-outline" size={20} color={selectedChapter ? colors.background : colors.muted} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.iconButton, { 
                                    backgroundColor: selectedChapter && selectedChapter !== lastRead ? colors.progressCompleted : colors.border 
                                }]}
                                disabled={!selectedChapter || selectedChapter === lastRead}
                                onPress={async () => {
                                    if (selectedChapter) {
                                        try {
                                            if (!isFollowed && manga) {
                                                await api.post('/api/watchlist', { mangaId: id, title: manga.title, lastRead: selectedChapter });
                                                setIsFollowed(true);
                                            }
                                            await api.post('/api/watchlist/lastread', { mangaId: id, lastRead: selectedChapter });
                                            setLastRead(selectedChapter);
                                        } catch {}
                                    }
                                }}
                                activeOpacity={0.8}
                            >
                                <Ionicons 
                                    name="checkmark-circle-outline" 
                                    size={20} 
                                    color={selectedChapter && selectedChapter !== lastRead ? "#fff" : colors.muted} 
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,        
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    coverWrapper: {
        width: '100%',
        height: '30%',
        position: 'relative',
        overflow: 'hidden',
        
    },
    coverImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        
    },
    coverPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    coverPlaceholderText: {
        fontSize: 50,
        fontWeight: 'bold',
    },
    headerButtons: {
        position: 'absolute',
        top: 50,
        left: 18,
        right: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 2,
    },
    headerButton: {
        padding: 10,
        borderRadius: 25,
        shadowColor: '#222',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    detailCard: {
        flex: 1,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
        shadowColor: '#222',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        zIndex: 1000,
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: '55%',
        padding: 22,
        paddingBottom: 40,

    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    author: {
        fontSize: 16,
        fontWeight: '400',
        marginBottom: 16,
        fontStyle: 'italic',
    },
    lastChapter: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'left',
        marginBottom: 6,
        alignSelf: "flex-start",
    },
    lastRead: {
        fontSize: 15,
        fontWeight: '600',
        color: '#222',
        backgroundColor: '#e5e7eb',
        textAlign: 'center',
        marginBottom: 14,
        alignSelf: "flex-start",
        position: "absolute",
        paddingHorizontal: 5,
        paddingVertical: 5,
        borderRadius: 4,
        top: 20,
        right: 20
    },
    buttonRow: {
        flexDirection: 'row',
        alignSelf: 'flex-start',
        marginTop: 10,
        marginBottom: 2,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 10,
        marginHorizontal: 5,
        backgroundColor: '#3b82f6',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.10,
        shadowRadius: 2,
        elevation: 1,
    },
    actionText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.1,
    },
    noChapter: {
        textAlign: 'center',
        marginTop: 22,
        color: '#a1a1aa',
        fontSize: 15,
        fontStyle: 'italic',
    },
    dropdownLabel: {
        fontSize: 16,
        fontWeight: '300',
        color: '#222',
        marginBottom: 4,
        marginTop: 12,
    },
    dropdown: {
        height: 52,
        paddingVertical: 0,
        textAlignVertical: 'center',
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 16,
        shadowColor: '#222',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
        width: '100%',
        minHeight: 52,
        fontSize: 16,
        justifyContent: 'center',
        alignItems: 'flex-start',
        position: 'relative',
    },
    placeholderStyle: { fontSize: 16, color: '#a1a1aa', fontWeight: '300' },
    selectedTextStyle: { fontSize: 16, color: '#222', fontWeight: '500' },
    inputSearchStyle: { height: 40, fontSize: 16 },
    button: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 7,
        // marginHorizontal: 0,
        backgroundColor: '#3b82f6',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.10,
        shadowRadius: 2,
        elevation: 1,
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 15,
        // fontWeight: 'bold',
        letterSpacing: 0.1,
        paddingHorizontal: 10,
    },
    dropdownItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        minHeight: 48,
        backgroundColor: '#fff',
    },
    dropdownItemLabel: {
        fontSize: 16,
        color: '#222',
        fontWeight: '400',
    },
    dropdownItemDate: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '300',
    },
    dropdownMenu: {
        position: 'absolute',
        top: 58,
        left: 0,
        borderColor: '#d1d5db',
        borderRadius: 12,
        backgroundColor: 'transparent',
        width: '100%',
        alignSelf: 'flex-start',
        shadowColor: '#222',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        zIndex: 1000,
    },
    searchContainer: {
        borderBottomColor: '#e5e7eb',
        borderBottomWidth: 1,
        padding: 12,
        backgroundColor: '#fff',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    searchTextInput: {
        height: 44,
        fontSize: 16,
        borderRadius: 7,
        backgroundColor: '#f3f4f6',
        color: '#222',
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
        marginBottom: 8,
    },
    dropdownContainer: {
        flex: 1,
        position: 'relative',
    },
    dropdownActive: {
        borderWidth: 2,
    },
    dropdownList: {
        maxHeight: 200,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
        marginTop: 8,
        shadowColor: '#222',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    dropdownArrow: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width: 50,
        zIndex: 10,
        backgroundColor: 'transparent',
    },
    dropdownArrowText: {
        fontSize: 22,
        color: '#6B7280',
        fontWeight: 'bold',
    },
    dropdownRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 16,
    },
    iconButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#222',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    dropdownText: {
        fontSize: 16,
        fontWeight: '500',
        textAlignVertical: 'center',
        flex: 1,
        paddingVertical: 0,
    },
    dropdownContent: {
        paddingBottom: 10,
    },
    mangaInfoCard: {
        paddingVertical: 10,
        backgroundColor: 'transparent',
    },
    chapterCard: {
        marginBottom: 20,
        borderRadius: 16,
        shadowColor: '#222',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        letterSpacing: -0.3,
    },
    progressContainer: {
        marginTop: 4,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressBarContainer: {
        marginRight: 10,
        flex: 1,
    },
    progressBarBg: {
        height: 12,
        borderRadius: 6,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    progressBarFill: {
        height: 12,
        borderRadius: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        zIndex: 1000,
    },
    noResultsContainer: {
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noResultsText: {
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
    },
});