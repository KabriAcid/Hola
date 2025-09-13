import { useState, useEffect } from "react";
import { User, AuthState } from "../types";
import { apiService } from "../services/api";

export const useAuth = () => {
  // Initialize from localStorage synchronously
  const initialUser = apiService.getUser();
  const initialToken = apiService.getToken();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: !!initialUser && !!initialToken,
    user: initialUser,
    isLoading: false,
  });

  // Keep localStorage and state in sync if token/user changes externally
  useEffect(() => {
    const handleStorage = () => {
      const user = apiService.getUser();
      const token = apiService.getToken();
      setAuthState({
        isAuthenticated: !!user && !!token,
        user,
        isLoading: false,
      });
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const login = async (phone: string, password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    try {
      const user = await apiService.login(phone, password);
      setAuthState({ isAuthenticated: true, user, isLoading: false });
    } catch (err) {
      apiService.clearAuth();
      setAuthState({ isAuthenticated: false, user: null, isLoading: false });
      throw err;
    }
  };

  const logout = () => {
    apiService.clearAuth();
    setAuthState({ isAuthenticated: false, user: null, isLoading: false });
    // Keep existing behaviour to force a full reload to clear state
    window.location.href = "/login";
  };

  const updateUser = (updatedUser: User) => {
    apiService.setUser(updatedUser);
    setAuthState((prev) => ({ ...prev, user: updatedUser }));
  };

  return { ...authState, login, logout, updateUser };
};
