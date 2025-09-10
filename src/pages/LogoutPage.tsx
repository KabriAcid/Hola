import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * LogoutPage: Handles user logout and redirect.
 * In the future, add API call to invalidate session/JWT here.
 */
export const LogoutPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // TODO: Add API call to invalidate session/JWT if needed
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  return null;
};
