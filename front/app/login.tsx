import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View, SafeAreaView, StatusBar, TouchableOpacity, ActivityIndicator } from "react-native";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    setLoading(true);
    setMessage("");
    try {
      if (isRegister) {
        await register(username, password);
        setMessage("Inscription réussie ! Connecte-toi.");
        setIsRegister(false);
      } else {
        await login(username, password);
        setMessage("");
        router.replace("/");
      }
    } catch (err: any) {
      setMessage(err?.response?.data?.message || "Erreur d'authentification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        <Text style={styles.title}>{isRegister ? "Inscription" : "Connexion"}</Text>
        <TextInput
          style={styles.input}
          placeholder="Utilisateur"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isRegister ? "S'inscrire" : "Se connecter"}</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setIsRegister(r => !r); setMessage(""); }}>
          <Text style={styles.switchText}>
            {isRegister ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafbfc',
    borderColor: '#e5e7eb',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  switchText: {
    color: '#3b82f6',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  message: {
    color: '#e11d48',
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '500',
  },
});
