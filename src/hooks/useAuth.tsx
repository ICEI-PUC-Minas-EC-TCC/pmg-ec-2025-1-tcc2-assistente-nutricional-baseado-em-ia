
'use client';

import type { LoginFormValues, RegisterFormValues, UserProfileFormValues } from '@/lib/schemas';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const USERS_STORAGE_KEY = 'nutritional_app_users';
const CURRENT_USER_EMAIL_KEY = 'nutritional_app_currentUserEmail';

interface StoredUser extends RegisterFormValues { // RegisterFormValues already has email, password, confirmPassword
  profile: UserProfileFormValues; // UserProfileFormValues now includes apiKey
}

interface AuthContextType {
  currentUser: StoredUser | null;
  login: (data: LoginFormValues) => Promise<boolean>;
  register: (data: RegisterFormValues) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  updateUserProfileInAuth: (profile: UserProfileFormValues) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const getUsers = useCallback((): StoredUser[] => {
    if (typeof window === 'undefined') return [];
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  }, []);

  const saveUsers = useCallback((users: StoredUser[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem(CURRENT_USER_EMAIL_KEY);
      if (email) {
        const users = getUsers();
        const user = users.find(u => u.email === email);
        if (user) {
          setCurrentUser(user);
        } else {
          // Clear invalid stored email
          localStorage.removeItem(CURRENT_USER_EMAIL_KEY);
        }
      }
      setIsLoading(false);
    }
  }, [getUsers]);

  const login = useCallback(async (data: LoginFormValues): Promise<boolean> => {
    const users = getUsers();
    const user = users.find(u => u.email === data.email && u.password === data.password); // Simplified password check
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(CURRENT_USER_EMAIL_KEY, user.email);
      return true;
    }
    return false;
  }, [getUsers]);

  const register = useCallback(async (data: RegisterFormValues): Promise<boolean> => {
    const users = getUsers();
    if (users.some(u => u.email === data.email)) {
      return false; // User already exists
    }
    const newUser: StoredUser = {
      email: data.email,
      password: data.password, // In a real app, hash this password!
      confirmPassword: data.confirmPassword,
      profile: { // Initialize with an empty profile, including apiKey
        name: '',
        age: undefined,
        weight: undefined,
        height: undefined,
        dietaryRestrictions: '',
        activityLevel: '',
        apiKey: '', // Initialize apiKey as empty
      },
    };
    saveUsers([...users, newUser]);
    return true;
  }, [getUsers, saveUsers]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CURRENT_USER_EMAIL_KEY);
    }
    router.push('/login');
  }, [router]);

  const updateUserProfileInAuth = useCallback((updatedProfile: UserProfileFormValues) => {
    if (currentUser) {
      // Ensure all fields, including apiKey, are preserved or updated
      const fullUpdatedProfile = { ...currentUser.profile, ...updatedProfile };
      const updatedUser = { ...currentUser, profile: fullUpdatedProfile };
      setCurrentUser(updatedUser);
      const users = getUsers();
      const userIndex = users.findIndex(u => u.email === currentUser.email);
      if (userIndex !== -1) {
        users[userIndex] = updatedUser;
        saveUsers(users);
      }
    }
  }, [currentUser, getUsers, saveUsers]);

  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout, isLoading, updateUserProfileInAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
