import { useRouter } from 'expo-router';
import { SafeAreaView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

export default function AccountScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const ready = useAuthRedirect();
  if (!ready) return null;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>Mon compte</Text>
        <Text style={{ fontSize: 16, marginBottom: 16 }}>Connecté en tant que <Text style={{ fontWeight: 'bold' }}>{user}</Text></Text>
        <TouchableOpacity
          onPress={async () => {
            await logout();
            router.replace('/login');
          }}
          style={{ backgroundColor: '#e11d48', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 32 }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
