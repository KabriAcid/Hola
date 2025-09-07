import { useState, useEffect } from 'react';
import { User, AuthState } from '../types';

const STORAGE_KEY = 'hola_auth';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  });

  useEffect(() => {
    // Check for existing auth on mount
    const storedAuth = localStorage.getItem(STORAGE_KEY);
    if (storedAuth) {
      try {
        const parsedAuth = JSON.parse(storedAuth);
        setAuthState({
          isAuthenticated: true,
          user: parsedAuth.user,
          isLoading: false,
        });
      } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = (user: User) => {
    const authData = { user, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
    setAuthState({
      isAuthenticated: true,
      user,
      isLoading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });
  };

  const updateUser = (updatedUser: User) => {
    const authData = { user: updatedUser, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
    setAuthState(prev => ({
      ...prev,
      user: updatedUser,
    }));
  };

  return {
    ...authState,
    login,
    logout,
    updateUser,
  };
};