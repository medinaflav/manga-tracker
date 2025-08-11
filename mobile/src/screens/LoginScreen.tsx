import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { useAuthStore } from '../store/auth';
import { apiFetch } from '../services/api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const setToken = useAuthStore((s) => s.setAccessToken);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onLogin = async () => {
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      setToken(res.accessToken);
      navigation.replace('Home');
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Text>Login</Text>
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize='none' />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Login" onPress={onLogin} />
      <Button title="No account? Sign up" onPress={() => navigation.navigate('Signup')} />
    </View>
  );
}
