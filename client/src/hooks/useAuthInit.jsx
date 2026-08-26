import React, { createContext, useContext, useEffect, useState } from "react";
import { clearAuthSession } from "../utils/authStorage";

const AuthContext = createContext({ status: "loading" });

export function AuthProvider({ children }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    // On startup, clear any existing auth session so old tokens
    // don't automatically navigate the user to protected routes.
    clearAuthSession();
    setStatus("unauthenticated");
  }, []);

  const authenticate = () => setStatus("authenticated");
  const signout = () => {
    clearAuthSession();
    setStatus("unauthenticated");
  };

  return (
    <AuthContext.Provider value={{ status, authenticate, signout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}