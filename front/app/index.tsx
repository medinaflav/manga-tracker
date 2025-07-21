import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';
import React from 'react';

export default function StartPage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/latest" />;
  } else {
    return <Redirect href="/login" />;
  }
} 