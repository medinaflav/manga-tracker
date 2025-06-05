import { useState } from 'react';
import { StyleSheet, TextInput, Button, FlatList, View, Text } from 'react-native';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/manga/search`, {
        params: { q: query },
      });
      setResults(data.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Titre du manga"
          value={query}
          onChangeText={setQuery}
        />
        <Button title="Rechercher" onPress={search} />
      </View>
      {loading ? (
        <Text>Recherche...</Text>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text>{item.attributes?.title?.en || 'Sans titre'}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    padding: 8,
    borderRadius: 4,
  },
  item: {
    paddingVertical: 8,
  },
});
