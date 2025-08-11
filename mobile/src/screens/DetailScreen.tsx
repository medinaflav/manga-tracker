import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button } from 'react-native';
import { apiFetch } from '../services/api';
import { useAuthStore } from '../store/auth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Detail'>;

export default function DetailScreen({ route }: Props) {
  const { id } = route.params;
  const token = useAuthStore((s) => s.accessToken);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    apiFetch(`/manga/${id}`).then(setData).catch(console.error);
  }, [id]);

  const addToWatch = async () => {
    if (!token || !data) return;
    await apiFetch('/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ mangaId: id, title: data.manga.title, coverUrl: data.manga.coverUrl })
    });
  };

  if (!data) return <View><Text>Loading...</Text></View>;

  return (
    <View style={{ padding: 16 }}>
      <Text>{data.manga.title}</Text>
      {data.aniList && <Text>{data.aniList.synopsis}</Text>}
      <Button title="Follow" onPress={addToWatch} />
      <FlatList
        data={data.chapters}
        keyExtractor={(c: any) => c.id}
        renderItem={({ item }) => (
          <Text>ch.{item.chapter} {item.title}</Text>
        )}
      />
    </View>
  );
}
