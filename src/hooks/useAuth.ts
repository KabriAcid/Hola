import { useState } from "react";
import { User, AuthState } from "../types";

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: false,
  });

  const login = (user: User) => {
    setAuthState({ isAuthenticated: true, user, isLoading: false });
  };

  const logout = () => {
    setAuthState({ isAuthenticated: false, user: null, isLoading: false });
  };

  const updateUser = (updatedUser: User) => {
    setAuthState((prev) => ({ ...prev, user: updatedUser }));
  };

  return { ...authState, login, logout, updateUser };
};
