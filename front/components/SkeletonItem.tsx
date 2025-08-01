import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export function SkeletonItem() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.popularItem}>
      <View style={[styles.popularCoverPlaceholder, { backgroundColor: colors.border }]} />
      <View style={[styles.skeletonTitle, { backgroundColor: colors.border }]} />
      <View style={[styles.skeletonSubtitle, { backgroundColor: colors.border }]} />
    </View>
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
  popularCoverPlaceholder: {
    width: 110,
    height: 155,
    borderRadius: 12,
    marginBottom: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  skeletonTitle: {
    width: 90,
    height: 16,
    borderRadius: 8,
    marginBottom: 6,
  },
  skeletonSubtitle: {
    width: 60,
    height: 12,
    borderRadius: 6,
  },
}); 