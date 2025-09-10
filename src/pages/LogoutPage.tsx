import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const LogoutPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const didLogout = useRef(false);

  useEffect(() => {
    if (!didLogout.current) {
      logout();
      didLogout.current = true;
      navigate("/login", { replace: true });
    }
  }, [logout, navigate]);

  return null;
};
