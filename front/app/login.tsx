import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View, SafeAreaView, StatusBar, TouchableOpacity, ActivityIndicator } from "react-native";
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Logo } from '@/components/Logo';
import { Badge } from '@/components/Badge';
import { Stack } from 'expo-router';

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <Logo size="large" />
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {isRegister ? "Rejoignez notre communauté" : "Connectez-vous à votre compte"}
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Utilisateur</Text>
              <View style={[styles.inputWrapper, { 
                backgroundColor: colors.background,
                borderColor: colors.border,
              }]}>
                <Text style={[styles.inputIcon, { color: colors.muted }]}>👤</Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Entrez votre nom d'utilisateur"
                  placeholderTextColor={colors.muted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Mot de passe</Text>
              <View style={[styles.inputWrapper, { 
                backgroundColor: colors.background,
                borderColor: colors.border,
              }]}>
                <Text style={[styles.inputIcon, { color: colors.muted }]}>🔒</Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Entrez votre mot de passe"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {message ? (
              <View style={styles.messageContainer}>
                <Badge 
                  variant={message.includes('réussie') ? 'success' : 'error'} 
                  size="medium"
                  animated
                >
                  {message}
                </Badge>
              </View>
            ) : null}

            <TouchableOpacity 
              style={[styles.button, { 
                backgroundColor: colors.primary,
                opacity: loading ? 0.7 : 1,
              }]} 
              onPress={handleSubmit} 
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text style={[styles.buttonText, { color: colors.background }]}>
                  {isRegister ? "Créer mon compte" : "Se connecter"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => { setIsRegister(r => !r); setMessage(""); }}
              style={styles.switchContainer}
              activeOpacity={0.7}
            >
              <Text style={[styles.switchText, { color: colors.primary }]}>
                {isRegister ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 16,
  },
  formContainer: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  messageContainer: {
    alignItems: 'center',
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    fontWeight: '700',
    fontSize: 16,
  },
  switchContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  switchText: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
});
