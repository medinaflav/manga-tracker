import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  setAccessToken: (t: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  setAccessToken: (t) => set({ accessToken: t })
}));
