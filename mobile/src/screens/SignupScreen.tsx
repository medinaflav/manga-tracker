import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { useAuthStore } from '../store/auth';
import { apiFetch } from '../services/api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

export default function SignupScreen({ navigation }: Props) {
  const setToken = useAuthStore((s) => s.setAccessToken);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSignup = async () => {
    try {
      const res = await apiFetch('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password })
      });
      setToken(res.accessToken);
      navigation.replace('Home');
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Text>Signup</Text>
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize='none' />
      <TextInput placeholder="Username" value={username} onChangeText={setUsername} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Create account" onPress={onSignup} />
    </View>
  );
}
