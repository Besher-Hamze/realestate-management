"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { authApi } from '@/lib/api';
import { User, AuthResponse } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
  checkAuth: async () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Check if user is authenticated on initial load, but only if we have a token
  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      const initAuth = async () => {
        setIsLoading(true);
        await checkAuth();
        setIsLoading(false);
      };
      
      initAuth();
    }
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await authApi.login(username, password);
      
      if (response.success && response.data) {
        const { token, user: userData } = response.data as AuthResponse;
        
        // Set token in cookie
        Cookies.set('token', token, { expires: 7 }); // 7 days
        
        // Set user from login response - no need for separate getMe call
        setUser(userData as User);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    Cookies.remove('token');
    setUser(null);
    router.push('/login');
  };

  // Check authentication status
  const checkAuth = async (): Promise<boolean> => {
    try {
      const token = Cookies.get('token');
      
      if (!token) {
        setUser(null);
        return false;
      }
      
      const response = await authApi.getMe();
      
      if (response.success && response.data) {
        setUser(response.data);
        return true;
      }
      
      Cookies.remove('token');
      setUser(null);
      return false;
    } catch (error) {
      console.error('Auth check error:', error);
      Cookies.remove('token');
      setUser(null);
      return false;
    }
  };

  // Calculate isAuthenticated based on user presence
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}