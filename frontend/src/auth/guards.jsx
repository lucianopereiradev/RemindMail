import { Navigate, useLocation } from "react-router";
import { useAuth } from "./context.js";
import { FullPageSpinner } from "../components/ui.jsx";

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/entrar" replace state={{ from: location.pathname }} />;
  return children;
}

export function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (user) return <Navigate to="/painel" replace />;
  return children;
}
