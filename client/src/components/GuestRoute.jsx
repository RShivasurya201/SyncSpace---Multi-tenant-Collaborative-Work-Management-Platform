import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuthInit";

function GuestRoute({ children }) {
  const { status } = useAuth();
  if (status === "loading") return null; // or a spinner component
  if (status === "authenticated") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default GuestRoute;