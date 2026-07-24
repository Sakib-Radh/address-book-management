import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../lib/axios';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token') || null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    if (token) {
      fetchUser();
      return;
    }
    setLoading(false);
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/me');
      setUser(response.data.data);
    } catch (error) {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    const response = await axios.post('/login', credentials);
    const newToken = response.data.data?.token;
    const userData = response.data.data?.user;
    if (newToken) {
      localStorage.setItem('auth_token', newToken);
      setToken(newToken);
      setUser(userData);
    }
    return response.data;
  };

  const register = async (userData) => {
    const response = await axios.post('/register', userData);
    const newToken = response.data.data?.token;
    const newUserData = response.data.data?.user;
    if (newToken) {
      localStorage.setItem('auth_token', newToken);
      setToken(newToken);
      setUser(newUserData);
    }
    return response.data;
  };

  const logout = async () => {
    try {
      if (token) {
        await axios.post('/logout');
      }
    } catch (error) {
      showToast('Logout failed on the server.', 'error');
    } finally {
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
