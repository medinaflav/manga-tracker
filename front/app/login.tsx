import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const { login: authLogin } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/login`, {
        username,
        password,
      });
      // You would typically store the token securely, e.g., in AsyncStorage
      console.log("Token:", data.token);
      authLogin(); // This will set isAuthenticated to true and trigger navigation
      router.replace("/(tabs)/latest"); // Redirection vers Nouveautés
    } catch {
      setMessage("Erreur de connexion");
    }
  };

  const register = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/register`, { username, password });
      setMessage("Inscription réussie");
    } catch {
      setMessage("Erreur lors de l'inscription");
    }
  };

  return (
    <View style={styles.container}>
      <>
        <TextInput
          style={styles.input}
          placeholder="Utilisateur"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Button title="Connexion" onPress={handleLogin} />
        <Button title="Inscription" onPress={register} />
        <Text>{message}</Text>
      </>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
  },
});
