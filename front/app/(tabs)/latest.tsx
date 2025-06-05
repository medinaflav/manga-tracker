import { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, Text } from 'react-native';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export default function LatestScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/comick/latest`);
      const list = Array.isArray(data) ? data : data?.data || [];
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <Text>Chargement...</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text>{item.title || item.slug || 'Sans titre'}</Text>
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
