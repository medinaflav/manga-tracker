import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import WatchlistScreen from '../screens/WatchlistScreen';
import DetailScreen from '../screens/DetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import { useAuthStore } from '../store/auth';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  Search: undefined;
  Watchlist: undefined;
  Detail: { id: string };
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigation() {
  const token = useAuthStore((s) => s.accessToken);
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {token ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="Watchlist" component={WatchlistScreen} />
            <Stack.Screen name="Detail" component={DetailScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
