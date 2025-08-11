import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { apiFetch } from '../services/api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';

type Release = { id: string; mangaId: string; chapter: number; title: string };

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [releases, setReleases] = useState<Release[]>([]);

  useEffect(() => {
    apiFetch('/releases/latest').then(setReleases).catch(console.error);
  }, []);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text>Dernières sorties</Text>
      <FlatList
        data={releases}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text onPress={() => navigation.navigate('Detail', { id: item.mangaId })}>
            {item.mangaId} - ch.{item.chapter}
          </Text>
        )}
      />
    </View>
  );
}
