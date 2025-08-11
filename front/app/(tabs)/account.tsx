import { useRouter } from 'expo-router';
import { SafeAreaView, StatusBar, Text, TouchableOpacity, View, StyleSheet, Switch } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { useTheme } from '@/contexts/ThemeContext';

export default function AccountScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const ready = useAuthRedirect();
  const { colors, currentTheme, isManualMode, manualDarkMode, toggleManualMode, toggleDarkMode } = useTheme();

  if (!ready) return null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={[styles.header, { color: colors.text }]}>Mon compte</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Gérez vos paramètres</Text>
        </View>

        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.accent }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {user?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.username, { color: colors.text }]}>{user}</Text>
            <Text style={[styles.userStatus, { color: colors.muted }]}>Connecté</Text>
          </View>
        </View>

        {/* Section Paramètres */}
        <View style={styles.settingsContainer}>
          <Text style={[styles.settingsTitle, { color: colors.text }]}>Paramètres</Text>
          
          {/* Mode Manuel */}
          <View style={[styles.settingRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Mode manuel</Text>
              <Text style={[styles.settingDescription, { color: colors.muted }]}>
                Choisir manuellement le mode clair/sombre
              </Text>
            </View>
            <Switch
              value={isManualMode}
              onValueChange={toggleManualMode}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isManualMode ? colors.background : colors.muted}
            />
          </View>

          {/* Mode Sombre */}
          <View style={[styles.settingRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Mode sombre</Text>
              <Text style={[styles.settingDescription, { color: colors.muted }]}>
                {isManualMode ? 'Activer le mode sombre' : 'Suivre les préférences système'}
              </Text>
            </View>
            <Switch
              value={manualDarkMode}
              onValueChange={toggleDarkMode}
              disabled={!isManualMode}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={manualDarkMode ? colors.background : colors.muted}
            />
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={async () => {
              await logout();
              router.replace('/login');
            }}
            style={[styles.logoutButton, { backgroundColor: colors.error }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.logoutButtonText, { color: colors.background }]}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  headerContainer: {
    marginBottom: 32,
  },
  header: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  userStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionsContainer: {
    marginTop: 'auto',
    paddingBottom: 100, // Espace pour la barre de navigation
  },
  logoutButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  settingsContainer: {
    marginBottom: 32,
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
});
