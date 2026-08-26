import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuthInit";

function ProtectedRoute({ children }) {
  const { status } = useAuth();
  if (status === "loading") return null; // wait for auth verification
  if (status !== "authenticated") {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default ProtectedRoute;
