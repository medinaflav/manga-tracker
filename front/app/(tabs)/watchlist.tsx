import axios from "axios";
import { useEffect, useState } from "react";
import { Button, FlatList, StyleSheet, Text, View } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export default function WatchlistScreen() {
  const [token, setToken] = useState<string | null>(null);
  const [mangas, setMangas] = useState<any[]>([]);

  // ⚠️ Si tu veux ajouter 'load' en dépendance, il faut le déclarer avec useCallback
  useEffect(() => {
    load();
  }, []); // Pas de dépendance pour éviter l'erreur de déclaration

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
    alignItems: "center",
    justifyContent: "center",
  },
});
