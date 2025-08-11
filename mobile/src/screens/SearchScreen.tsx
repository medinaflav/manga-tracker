import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, Button } from 'react-native';
import { apiFetch } from '../services/api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';

type Manga = { id: string; title: string };

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

export default function SearchScreen({ navigation }: Props) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Manga[]>([]);

  const onSearch = async () => {
    const data = await apiFetch(`/manga/search?q=${encodeURIComponent(q)}`);
    setResults(data);
  };

  return (
    <View style={{ padding: 16 }}>
      <TextInput placeholder="Search" value={q} onChangeText={setQ} />
      <Button title="Search" onPress={onSearch} />
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text onPress={() => navigation.navigate('Detail', { id: item.id })}>{item.title}</Text>
        )}
      />
    </View>
  );
}
