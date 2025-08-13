"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { authApi } from '@/lib/api';
import { User, AuthResponse } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  canEdit: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<{ status: boolean, message: string }>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true, // Start with true to prevent premature redirects
  canEdit: false,
  isAuthenticated: false,
  login: async () => ({ status: false, message: '' }),
  logout: () => { },
  checkAuth: async () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with true
  const router = useRouter();

  // Calculate canEdit based on user role
  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  // Check if user is authenticated on initial load
  useEffect(() => {
    const initAuth = async () => {
      console.log('AuthProvider: Initializing auth check...'); // Debug log

      const token = Cookies.get('token');
      if (token) {
        console.log('AuthProvider: Token found, checking auth...'); // Debug log
        await checkAuth();
      } else {
        console.log('AuthProvider: No token found'); // Debug log
      }

      setIsLoading(false);
      console.log('AuthProvider: Auth check complete'); // Debug log
    };

    initAuth();
  }, []);

  // Login function with remember me support
  const login = async (username: string, password: string, rememberMe: boolean = false): Promise<{ status: boolean, message: string }> => {
    try {
      console.log('AuthProvider: Attempting login...'); // Debug log
      setIsLoading(true);

      const response = await authApi.login(username, password);

      if (response.success && response.data) {
        console.log(response.data);

        const { token, ...userData } = response.data;

        // Set token in cookie with appropriate expiration
        // const cookieOptions = {
        //   expires: rememberMe ? 30 : 7, // 30 days if remember me, 7 days otherwise
        //   secure: process.env.NODE_ENV === 'production',
        //   sameSite: 'lax' as const
        // };

        Cookies.set('token', token, { expires: 7 }); // 7 days


        // Store remember me preference
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('username', username);
        } else {
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('username');
        }

        // Set user from login response
        setUser(userData as any);
        console.log('AuthProvider: Login successful, user set:', userData); // Debug log

        return { status: true, message: "Login successful" };
      }

      return { status: false, message: response.message };
    } catch (error) {
      console.error('Login error:', error);
      return { status: false, message: "" };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    console.log('AuthProvider: Logging out...'); // Debug log
    Cookies.remove('token');
    setUser(null);

    // Don't remove remember me data on logout
    // localStorage.removeItem('rememberMe');
    // localStorage.removeItem('username');

    router.push('/login');
  };

  // Check authentication status
  const checkAuth = async (): Promise<boolean> => {
    try {
      const a = 0;
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

      console.log('AuthProvider: Auth check failed, removing token'); // Debug log
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
        canEdit,
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