import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { apiFetch } from '../services/api';
import { useAuthStore } from '../store/auth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';

type WatchItem = { mangaId: string; title: string; lastKnownChapter: number };

type Props = NativeStackScreenProps<RootStackParamList, 'Watchlist'>;

export default function WatchlistScreen({ navigation }: Props) {
  const token = useAuthStore((s) => s.accessToken);
  const [items, setItems] = useState<WatchItem[]>([]);

  useEffect(() => {
    if (token)
      apiFetch('/watchlist', { headers: { Authorization: `Bearer ${token}` } })
        .then(setItems)
        .catch(console.error);
  }, [token]);

  return (
    <View style={{ padding: 16 }}>
      <Text>Watchlist</Text>
      <FlatList
        data={items}
        keyExtractor={(i) => i.mangaId}
        renderItem={({ item }) => (
          <Text onPress={() => navigation.navigate('Detail', { id: item.mangaId })}>
            {item.title} (last {item.lastKnownChapter})
          </Text>
        )}
      />
    </View>
  );
}
