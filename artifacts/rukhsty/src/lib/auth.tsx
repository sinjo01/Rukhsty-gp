import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { UserWithProfile } from "@workspace/api-client-react";
import { useGetMe } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface AuthContextType {
  user: UserWithProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: UserWithProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("rukhsty_token"));
  const [, setLocation] = useLocation();

  // If we have a token, fetch the user
  const { data: user, isLoading: isUserLoading, isError } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  useEffect(() => {
    if (isError) {
      // Token is likely invalid
      localStorage.removeItem("rukhsty_token");
      setToken(null);
    }
  }, [isError]);

  const handleLogin = (newToken: string, loggedInUser: UserWithProfile) => {
    localStorage.setItem("rukhsty_token", newToken);
    setToken(newToken);
    // User data will be updated via useGetMe refetch
  };

  const handleLogout = () => {
    localStorage.removeItem("rukhsty_token");
    setToken(null);
    setLocation("/login");
  };

  const value = {
    user: user || null,
    isLoading: !!token && isUserLoading,
    isAuthenticated: !!token && !!user,
    login: handleLogin,
    logout: handleLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
