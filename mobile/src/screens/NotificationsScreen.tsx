import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import { useAuthStore } from '../store/auth';
import { apiFetch } from '../services/api';
export default function NotificationsScreen() {
  const token = useAuthStore((s) => s.accessToken);
  const [url, setUrl] = useState<string | null>(null);

  const linkTelegram = async () => {
    if (!token) return;
    const res = await apiFetch('/notify/telegram/link-url', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    setUrl(res.url);
  };

  return (
    <View style={{ padding: 16 }}>
      <Text>Notifications Telegram</Text>
      {url ? <Text>Ouvrez {url} pour lier votre compte.</Text> : <Button title="Connecter Telegram" onPress={linkTelegram} />}
    </View>
  );
}
