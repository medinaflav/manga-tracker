import React, { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { api } from "@/utils/api";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface AuthContextType {
  isAuthenticated: boolean;
  user: string | null;
  token: string | null;
  authLoaded: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const isAuthenticated = !!token;

  // Charge le token au démarrage
  useEffect(() => {
    AsyncStorage.getItem('token').then(stored => {
      if (stored) {
        setToken(stored);
        // Décoder le username du JWT (optionnel, sinon stocker à la connexion)
        try {
          const payload = JSON.parse(atob(stored.split('.')[1]));
          setUser(payload.username);
        } catch {}
      }
      setAuthLoaded(true);
    });
  }, []);

  // Ajoute le token à toutes les requêtes API
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  async function registerForPushNotificationsAsync() {
    let token;
    if (Constants.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return null;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
    } else {
      alert('Must use physical device for Push Notifications');
      return null;
    }
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    return token;
  }

  const login = async (username: string, password: string) => {
    const { data } = await api.post('/api/auth/login', { username, password });
    setToken(data.token);
    setUser(username);
    await AsyncStorage.setItem('token', data.token);
    const token = await registerForPushNotificationsAsync();
    if (token) {
      await api.post('/api/auth/expoPushToken', {
        username,
        expoPushToken: token,
      });
    }
  };

  const register = async (username: string, password: string) => {
    await api.post('/api/auth/register', { username, password });
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, authLoaded, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
