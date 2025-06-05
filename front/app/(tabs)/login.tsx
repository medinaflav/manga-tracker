import axios from 'axios';
import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const login = async () => {
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/login`, { username, password });
      setToken(data.token);
      setMessage('Connecté');
    } catch {
      setMessage('Erreur de connexion');
    }
  };

  const register = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/register`, { username, password });
      setMessage('Inscription réussie');
    } catch {
      setMessage("Erreur lors de l'inscription");
    }
  };

  return (
    <View style={styles.container}>
      {token ? (
        <Text>Token obtenu: {token}</Text>
      ) : (
        <>
          <TextInput style={styles.input} placeholder="Utilisateur" value={username} onChangeText={setUsername} />
          <TextInput style={styles.input} placeholder="Mot de passe" secureTextEntry value={password} onChangeText={setPassword} />
          <Button title="Connexion" onPress={login} />
          <Button title="Inscription" onPress={register} />
          <Text>{message}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
  },
});
