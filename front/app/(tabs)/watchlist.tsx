import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, Button } from 'react-native';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export default function WatchlistScreen() {
  const [token, setToken] = useState<string | null>(null);
  const [mangas, setMangas] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      load();
    }
  }, [token]);

  const load = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/watchlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMangas(data);
    } catch {
      setMangas([]);
    }
  };

  if (!token) {
    return (
      <View style={styles.center}>
        <Text>Connectez-vous pour voir votre liste.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={mangas}
        keyExtractor={(item) => item.mangaId}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item.title}</Text>
          </View>
        )}
      />
      <Button title="Rafraîchir" onPress={load} />
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
