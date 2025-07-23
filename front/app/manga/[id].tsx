import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, TextInput } from "react-native";
import axios from 'axios';
import { api } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';
import { API_URL } from '@/utils/api';

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
    const [manga, setManga] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [chapterItems, setChapterItems] = useState<{ label: string; value: string }[]>([]);
    const [lastChapterComick, setLastChapterComick] = useState<string | null>(null);
    const [lastRead, setLastRead] = useState<string | null>(null);
    const [isFollowed, setIsFollowed] = useState(false);
    const [dropdownFocus, setDropdownFocus] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [filteredItems, setFilteredItems] = useState<{ label: string; value: string }[]>([]);

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
        axios.get(`https://api.mangadex.org/manga/${id}`, { params: { includes: ["cover_art", "author"] } })
            .then(({ data }) => {
                const mangaData = data.data;
                const coverRel = mangaData.relationships?.find((r: any) => r.type === "cover_art");
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

    // Fetch last chapter from Comick
    useEffect(() => {
        if (!manga?.title) return;
        (async () => {
            try {
                const res = await axios.get('https://api.comick.io/v1.0/search', { params: { q: manga.title, limit: 1 } });
                setLastChapterComick(res.data?.[0]?.last_chapter || null);
            } catch {
                setLastChapterComick(null);
            }
        })();
    }, [manga?.title]);

    // Build chapter items
    useEffect(() => {
        if (!lastChapterComick) { setChapterItems([]); return; }
        const max = parseInt(lastChapterComick, 10);
        if (isNaN(max) || max <= 0) { setChapterItems([]); return; }
        setChapterItems(
            Array.from({ length: max }, (_, i) => ({ label: `Ch. ${max - i}`, value: (max - i).toString() }))
        );
    }, [lastChapterComick]);

    // Filter items based on search
    useEffect(() => {
        if (searchText.trim() === '') {
            setFilteredItems(chapterItems);
        } else {
            const filtered = chapterItems.filter(item => 
                item.label.toLowerCase().includes(searchText.toLowerCase())
            );
            setFilteredItems(filtered);
        }
    }, [searchText, chapterItems]);

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
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#222" />

            {/* Couverture + bouton retour */}
            <View style={styles.coverWrapper}>
                {manga.coverUrl ? (
                    <Image source={{ uri: manga.coverUrl }} style={styles.coverImage} />
                ) : null}
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={28} color="#222" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.followButton}
                    onPress={async () => {
                        try {
                            if (!isFollowed) {
                                await api.post('/api/watchlist', { mangaId: id, title: manga.title, lastRead });
                                setIsFollowed(true);
                            } else {
                                await api.delete('/api/watchlist', { data: { mangaId: id } });
                                setIsFollowed(false);
                            }
                        } catch { }
                    }}>
                    <Ionicons name={isFollowed ? "heart" : "heart-outline"} size={28} color={isFollowed ? "#e11d48" : "#222"} />
                </TouchableOpacity>
            </View>

            {/* Détails sous forme de carte blanche */}
            <View style={styles.detailCard}>
                <ScrollView contentContainerStyle={styles.detailContent}>
                    <Text style={styles.title}>{manga.title}</Text>
                    <Text style={styles.author}>{manga.author}</Text>
                    {/* {lastChapterComick && <Text style={styles.lastChapter}>Chapitre {lastChapterComick}</Text>} */}
                    {lastRead !== undefined && (
                        <Text
                            style={[
                                styles.lastRead,
                                Number(lastRead) === Number(lastChapterComick) && { backgroundColor: '#bbf7d0', color: "#166534" }
                            ]}
                        >
                            {Number(lastRead) === 0
                                ? "Pas commencé"
                                : Number(lastRead) === Number(lastChapterComick)
                                    ? "À jour"
                                    : `${lastRead} / ${lastChapterComick}`}
                        </Text>
                    )}

                    <Text style={styles.dropdownLabel}>Dernier chapitre lu</Text>
                    <View style={styles.dropdownRow}>
                        <View style={[styles.dropdownContainer, { flex: 1, marginBottom: 0 }]}> 
                            <View style={{ position: 'relative', width: '100%' }}>
                                <TextInput
                                    style={[styles.dropdown, open && styles.dropdownActive]}
                                    placeholderTextColor={lastRead === undefined ? "#a1a1aa" : "#222"}                                placeholder={
                                        selectedChapter ? 
                                        selectedChapter : 
                                        lastRead ? 
                                        lastRead :
                                        `${chapterItems.length} chapitres disponible`
                                    }
                                    value={open ? searchText : ''}
                                    onChangeText={setSearchText}
                                    onFocus={() => setOpen(true)}
                                    onBlur={() => {
                                        if (!open) setSearchText('');
                                    }}
                                />
                                <TouchableOpacity
                                    style={styles.dropdownArrow}
                                    onPress={() => setOpen(o => !o)}
                                    activeOpacity={0.7}
                                    focusable={false}
                                >
                                    <Ionicons
                                        name={open ? 'chevron-up' : 'chevron-down'}
                                        size={24}
                                        color="#6B7280"
                                    />
                                </TouchableOpacity>
                            </View>
                            {open && (
                                <View style={styles.dropdownMenu}>
                                    <ScrollView 
                                        style={styles.dropdownList}
                                        nestedScrollEnabled={true}
                                        keyboardShouldPersistTaps="handled"
                                    >
                                        {filteredItems.map((item, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                style={styles.dropdownItemRow}
                                                onPress={() => {
                                                    setSelectedChapter(item.value);
                                                    setOpen(false);
                                                    setSearchText('');
                                                }}
                                            >
                                                <Text style={styles.dropdownItemLabel}>{item.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.iconButton, { backgroundColor: selectedChapter ? '#3b82f6' : '#ccc', marginRight: 8 }]}
                                disabled={!selectedChapter}
                                onPress={async () => {
                                    if (!manga?.title || !selectedChapter) return;
                                    const slug = slugify(manga.title);
                                    console.log("slug: ", slug);
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
                                }}
                            >
                                <Ionicons name="book-outline" size={20} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.iconButton, { backgroundColor: selectedChapter || selectedChapter === lastRead ? '#10b981' : '#ccc' }]}
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
                            >
                                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.buttonRow}>
                        
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#0a0a0a',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    coverWrapper: {
        width: '100%',
        height: '70%',
        backgroundColor: '#18181b',
        overflow: 'hidden',
    },
    coverImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    backButton: {
        position: 'absolute',
        top: 32,
        left: 18,
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 24,
        zIndex: 2,
        shadowColor: '#222',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
        elevation: 4,
    },
    followButton: {
        position: 'absolute',
        top: 32,
        right: 18,
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 24,
        zIndex: 2,
        shadowColor: '#222',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
        elevation: 4,
    },
    detailCard: {
        flex: 1,
        backgroundColor: '#fff',
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
    },
    detailContent: {
        padding: 22,
        paddingBottom: 40,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'left',
        marginBottom: 5,
        color: '#18181b',
        letterSpacing: 0.1,
    },
    author: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'left',
        marginBottom: 5,
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
        height: 44,
        paddingVertical: 0, // ou ajuste pour centrer le texte
        textAlignVertical: 'center', // parfois utile sur Android
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 7,
        backgroundColor: '#fff',
        paddingHorizontal: 14,
        shadowColor: '#222',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
        width: '80%',
        alignSelf: 'flex-start',
        minHeight: 44,
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
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    dropdownItemLabel: {
        fontSize: 14,
        color: '#222',
        fontWeight: '300',
    },
    dropdownItemDate: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '300',
    },
    dropdownMenu: {
        position: 'absolute',
        top: 45,
        left: 0,
        borderColor: '#d1d5db',
        borderRadius: 7,
        backgroundColor: 'transparent',
        width: '80%',
        alignSelf: 'flex-start',
        shadowColor: '#222',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
    },
    searchContainer: {
        borderBottomColor: '#e5e7eb',
        borderBottomWidth: 1,
        padding: 4,
        backgroundColor: '#fff',
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
        width: '80%',
        alignSelf: 'flex-start',
        position: 'relative',
    },
    dropdownActive: {
        borderColor: '#3b82f6',
        backgroundColor: '#fff',
        fontSize: 14,
    },
    dropdownList: {
        maxHeight: 200,
        backgroundColor: '#fff',
        borderRadius: 7,
        borderWidth: 1,
        borderColor: '#d1d5db',
        marginTop: 6,
        shadowColor: '#222',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    dropdownArrow: {
        position: 'absolute',
        right: '21%',
        top: '2%',
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width: 40,
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
        marginBottom: 12,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: "-10%",
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
});