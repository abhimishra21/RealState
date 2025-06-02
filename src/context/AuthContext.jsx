import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI } from '../services/api';
import { showNotification } from '../utils/notifications.jsx';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const refreshToken = localStorage.getItem('refreshToken');
    const userId = localStorage.getItem('userId');
    
    if (refreshToken && userId) {
      // Fetch user data
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (retryCount = 0) => {
    try {
      setError(null);
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('No user ID found');
      }

      // Try to get current user first
      try {
        const response = await userAPI.getCurrentUser();
        setUser(response.data);
        setLoading(false);
        return;
      } catch (currentUserError) {
        console.log('Failed to get current user, trying getUser:', currentUserError);
      }

      // If getCurrentUser fails, try getUser
      const response = await userAPI.getUser(userId);
      setUser(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user:', err);
      
      // If we haven't retried yet and it's an auth error, try refreshing the token
      if (retryCount === 0 && (err.response?.status === 401 || err.response?.status === 403)) {
        try {
          const refreshSuccess = await authAPI.refreshToken();
          if (refreshSuccess) {
            // Retry fetching user data
            return fetchUser(retryCount + 1);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          showNotification('Your session has expired. Please sign in again.', {
            variant: 'error'
          });
        }
      }

      const errorMessage = err.response?.data?.message || 'Failed to fetch user data';
      setError(errorMessage);
      showNotification(errorMessage, {
        variant: 'error'
      });
      setLoading(false);
      
      // If we've exhausted retries and still have an auth error, sign out
      if (retryCount > 0 && (err.response?.status === 401 || err.response?.status === 403)) {
        signout();
      }
    }
  };

  const signup = async (userData) => {
    try {
      setError(null);
      const response = await authAPI.signup(userData);
      const { user, refreshToken } = response.data;
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userId', user._id);
      setUser(user);
      showNotification('Account created successfully!', {
        variant: 'success'
      });
      return user;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'An error occurred during signup';
      setError(errorMessage);
      showNotification(errorMessage, {
        variant: 'error'
      });
      throw err;
    }
  };

  const signin = async (credentials) => {
    try {
      setError(null);
      const response = await authAPI.signin(credentials);
      const { user, refreshToken } = response.data;
      
      // Store tokens and user ID
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userId', user._id);
      
      setUser(user);
      showNotification('Successfully signed in!', {
        variant: 'success'
      });
      return user;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Invalid email or password';
      setError(errorMessage);
      showNotification(errorMessage, {
        variant: 'error'
      });
      throw err;
    }
  };

  const signout = async () => {
    try {
      // Attempt to sign out via API
      const success = await authAPI.signout();
      
      // Clear local storage regardless of API success
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      setUser(null);
      setError(null);

      if (success) {
        showNotification('Successfully signed out', {
          variant: 'success'
        });
      } else {
        // Show a more generic error if API call failed but local state is cleared
        showNotification('Signed out locally, but server signout failed.', {
          variant: 'warning'
        });
      }
      
      // Always redirect to auth page after attempting signout
      window.location.href = '/auth';

    } catch (err) {
      console.error('Error during signout in AuthContext:', err);
      // Ensure local state is cleared and redirect even on unexpected errors
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      setUser(null);
      setError(null);
      showNotification('An unexpected error occurred during signout.', {
        variant: 'error'
      });
      window.location.href = '/auth';
    }
  };

  const value = {
    user,
    error,
    loading,
    signup,
    signin,
    signout,
    refreshUser: fetchUser, // Add this to allow manual refresh of user data
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 