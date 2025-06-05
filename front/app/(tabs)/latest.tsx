import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export default function LatestScreen() {
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/manga/latest`);
      setChapters(data.data || []);
    } catch {
      setChapters([]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      {loading ? (
        <Text>Chargement...</Text>
      ) : (
        <FlatList
          data={chapters}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text>
                {item.attributes?.chapter
                  ? `Chapitre ${item.attributes.chapter}`
                  : 'Chapitre'}
              </Text>
              {item.attributes?.title ? (
                <Text>{item.attributes.title}</Text>
              ) : null}
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
  item: {
    paddingVertical: 8,
  },
});
