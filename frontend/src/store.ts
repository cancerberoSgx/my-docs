import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole } from './enums';

function decodeRole(token: string): UserRole | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role as UserRole ?? null;
  } catch { return null; }
}

interface AuthState {
  token: string | null;
  role: UserRole | null;
  setToken: (token: string) => void;
  clearToken: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      setToken: (token) => set({ token, role: decodeRole(token) }),
      clearToken: () => set({ token: null, role: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) state.role = decodeRole(state.token);
      },
    }
  )
);
