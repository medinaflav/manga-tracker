import React from 'react';
import { FlatList, Text, StyleSheet, View } from 'react-native';
import { MangaItem } from './MangaItem';
import { SkeletonItem } from './SkeletonItem';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface MangaGridProps {
  data: any[];
  loading: boolean;
  onItemPress: (item: any) => void;
  showChapter?: boolean;
  emptyText?: string;
  numColumns: number;
  getSkeletonData: (num: number) => any[];
}

export function MangaGrid({ 
  data, 
  loading, 
  onItemPress, 
  showChapter = false,
  emptyText = "Aucun résultat",
  numColumns,
  getSkeletonData
}: MangaGridProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <FlatList
      data={loading ? getSkeletonData(numColumns * 2) : data}
      keyExtractor={(item) => item.id || `skeleton-${item.id}`}
      numColumns={numColumns}
      key={`grid-${numColumns}-${loading ? 'skeleton' : 'data'}`}
      scrollEnabled={false}
      contentContainerStyle={styles.popularGrid}
      columnWrapperStyle={{ justifyContent: 'flex-start' }}
      renderItem={({ item, index }) => {
        const isLastInRow = (index + 1) % numColumns === 0;
        return loading ? (
          <SkeletonItem />
        ) : (
          <MangaItem 
            item={item} 
            onPress={() => onItemPress(item)}
            showChapter={showChapter}
            index={index}
          />
        );
      }}
      ListEmptyComponent={!loading ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyIcon, { color: colors.muted }]}>📚</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>{emptyText}</Text>
        </View>
      ) : null}
    />
  );
}

const styles = StyleSheet.create({
  popularGrid: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
}); 