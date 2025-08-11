import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, View, Text, Image, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface MangaItemProps {
  item: {
    id?: string;
    title?: string;
    mangaTitle?: string;
    coverUrl?: string;
    chapter?: string;
    page?: number;
  };
  onPress: () => void;
  showChapter?: boolean;
  index?: number;
}

export function MangaItem({ item, onPress, showChapter = false, index = 0 }: MangaItemProps) {
  const { colors } = useTheme();
  
  // Animations
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 50),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <TouchableOpacity 
        style={styles.popularItem} 
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View 
          style={[
            styles.popularCoverShadow, 
            { 
              shadowColor: colors.text,
              transform: [{ scale: pressAnim }],
            }
          ]}
        >
          {item.coverUrl ? (
            <Image source={{ uri: item.coverUrl }} style={styles.popularCover} />
          ) : (
            <View style={[styles.popularCoverPlaceholder, { backgroundColor: colors.border }]}>
              <Text style={[styles.placeholderText, { color: colors.muted }]}>📚</Text>
            </View>
          )}
          <View style={[styles.coverOverlay, { backgroundColor: colors.primary + '15' }]} />
        </Animated.View>
        <Text style={[styles.popularTitle, { color: colors.text }]} numberOfLines={2}>
          {item.title || item.mangaTitle}
        </Text>
        {showChapter && (
          <Animated.View 
            style={[
              styles.chapterBadge, 
              { backgroundColor: colors.accent },
              {
                opacity: opacityAnim,
                transform: [{ translateY: opacityAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                })}],
              }
            ]}
          >
            <Text style={[styles.chapterText, { color: colors.primary }]}>
              Ch. {item.chapter}{item.page && item.page > 0 ? ` P.${item.page}` : ''}
            </Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  popularItem: {
    flex: 1,
    alignItems: "center",
    maxWidth: 110,
    marginRight: 16,
    marginBottom: 16,
  },
  popularCoverShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderRadius: 12,
    marginBottom: 10,
    position: 'relative',
  },
  popularCover: {
    width: 110,
    height: 155,
    borderRadius: 12,
    backgroundColor: "#eee",
  },
  popularCoverPlaceholder: {
    width: 110,
    height: 155,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: '#222',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  placeholderText: {
    fontSize: 24,
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  popularTitle: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  chapterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chapterText: {
    fontSize: 11,
    fontWeight: '600',
  },
}); 