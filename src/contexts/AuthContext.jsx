import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { showNotification } from '../utils/notifications';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = authAPI.checkAuth();
      setIsAuthenticated(isAuth);
      
      if (isAuth) {
        const response = await authAPI.getCurrentUser();
        setUser(response.data);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signin = async (credentials) => {
    try {
      const response = await authAPI.signin(credentials);
      setUser(response.data.user);
      setIsAuthenticated(true);
      showNotification('Successfully signed in!', { variant: 'success' });
      return response;
    } catch (error) {
      console.error('Signin failed:', error);
      throw error;
    }
  };

  const signup = async (userData) => {
    try {
      const response = await authAPI.signup(userData);
      showNotification('Account created successfully! Please sign in.', { variant: 'success' });
      return response;
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const signout = async () => {
    try {
      await authAPI.signout();
      setUser(null);
      setIsAuthenticated(false);
      showNotification('Successfully signed out!', { variant: 'success' });
    } catch (error) {
      console.error('Signout failed:', error);
      // Still clear the state even if the API call fails
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    signin,
    signup,
    signout,
    checkAuth
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 