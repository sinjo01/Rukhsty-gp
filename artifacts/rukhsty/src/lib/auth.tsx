import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  isEmailVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
  profile?: {
    id?: string;
    userId?: string;
    firstName?: string;
    secondName?: string;
    thirdName?: string;
    familyName?: string;
    age?: number;
    nationalId?: string;
    phone?: string;
    governorate?: string;
    city?: string;
    area?: string;
    address?: string;
    personalPhotoUrl?: string;
    idFrontUrl?: string;
    idBackUrl?: string;
    profileStatus?: string;
  } | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, userData?: unknown) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("rukhsty_token"));
  const [, setLocation] = useLocation();

  const { data: user, isLoading: isUserLoading, isError } = useGetMe({
    query: {
      enabled: !!token,
      queryKey: getGetMeQueryKey(),
      retry: false,
    },
  });

  useEffect(() => {
    if (isError) {
      localStorage.removeItem("rukhsty_token");
      setToken(null);
    }
  }, [isError]);

  const handleLogin = (newToken: string, _userData?: unknown) => {
    localStorage.setItem("rukhsty_token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("rukhsty_token");
    setToken(null);
    setLocation("/login");
  };

  const value: AuthContextType = {
    user: (user as AuthUser) || null,
    isLoading: !!token && isUserLoading,
    isAuthenticated: !!token && !!user,
    login: handleLogin,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
