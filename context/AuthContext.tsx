import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile } from '../types';
import { mockDb } from '../services/mockDb';

interface AuthContextType {
  user: Profile | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for persistent login session
    const storedUser = localStorage.getItem('physio_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const foundUser = await mockDb.login(username, password);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('physio_user', JSON.stringify(foundUser));
    } else {
      throw new Error('Identifiants incorrects');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('physio_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};