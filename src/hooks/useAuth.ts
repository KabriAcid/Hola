import { useState, useEffect } from "react";
import { User, AuthState } from "../types";
import { apiService } from "../services/api";

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  });

  // Load user from JWT on mount
  useEffect(() => {
    const loadUser = async () => {
      setAuthState((prev) => ({ ...prev, isLoading: true }));
      try {
        const user = await apiService.getCurrentUser();
        setAuthState({ isAuthenticated: true, user, isLoading: false });
      } catch (err) {
        // Always clear JWT and state on error
        apiService.setToken(null);
        setAuthState({ isAuthenticated: false, user: null, isLoading: false });
      }
    };
    loadUser();
  }, []);

  const login = async (phone: string, password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    try {
      const user = await apiService.login(phone, password);
      setAuthState({ isAuthenticated: true, user, isLoading: false });
    } catch (err) {
      // Always clear JWT and state on error
      apiService.setToken(null);
      setAuthState({ isAuthenticated: false, user: null, isLoading: false });
      throw err;
    }
  };

  const logout = () => {
    apiService.setToken(null);
    setAuthState({ isAuthenticated: false, user: null, isLoading: false });
    // Optionally, force reload to clear any stale state
    // window.location.href = "/login";
  };

  const updateUser = (updatedUser: User) => {
    setAuthState((prev) => ({ ...prev, user: updatedUser }));
  };

  return { ...authState, login, logout, updateUser };
};
