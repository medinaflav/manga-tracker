import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Redirects the user to /login if not authenticated.
 * Returns true once auth state is loaded.
 */
export function useAuthRedirect() {
  const { isAuthenticated, authLoaded } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!authLoaded) return;
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoaded, isAuthenticated, router]);
  return authLoaded;
}
