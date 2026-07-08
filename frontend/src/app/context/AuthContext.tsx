import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "@/lib/api";
import { safeJsonParse } from "@/lib/safeJson";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: "customer" | "admin";
}

interface ProfileData {
  first_name: string;
  last_name: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: ProfileData) => Promise<void>;
  changePassword: (current_password: string, new_password: string) => Promise<void>;
}

interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]   = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("sl_token");
    const savedUser  = safeJsonParse<User | null>("sl_user", null);
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("sl_token", data.token);
    localStorage.setItem("sl_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (formData: RegisterData) => {
    const { data } = await api.post("/auth/register", formData);
    localStorage.setItem("sl_token", data.token);
    localStorage.setItem("sl_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("sl_token");
    localStorage.removeItem("sl_user");
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData: ProfileData) => {
    await api.put("/auth/profile", profileData);
    const updatedUser = { ...user, ...profileData } as User;
    localStorage.setItem("sl_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const changePassword = async (current_password: string, new_password: string) => {
    await api.put("/auth/change-password", { current_password, new_password });
  };

  return (
    <AuthContext.Provider value={{ user, token, isAdmin: user?.role === "admin", loading, login, register, logout, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
