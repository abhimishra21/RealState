import axios from 'axios';
import { showNotification } from '../utils/notifications.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // For FormData requests, don't set Content-Type header
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Log the error for debugging
    console.error('API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      headers: error.config?.headers,
      url: error.config?.url
    });

    // If error is 401/403 and we haven't tried to refresh token yet
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { token } = response.data;
        localStorage.setItem('token', token);

        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signin: async (credentials) => {
    try {
      const response = await api.post('/auth/signin', credentials);
      const { token, refreshToken } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      return response;
    } catch (error) {
      console.error('Signin error:', error);
      throw error;
    }
  },

  signup: async (userData) => {
    try {
      const response = await api.post('/auth/signup', userData);
      const { token, refreshToken } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      return response;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  signout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },
};

// User APIs
export const userAPI = {
  getCurrentUser: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No authentication token found');
      }

      const response = await api.get('/api/user/me');
      return response;
    } catch (error) {
      console.error('Error fetching current user:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Try to refresh token
        const refreshSuccess = await authAPI.refreshToken();
        if (refreshSuccess) {
          // Retry the request
          return await api.get('/api/user/me');
        }
      }
      throw error;
    }
  },
  getUser: async (userId) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No authentication token found');
      }

      const response = await api.get(`/api/user/${userId}`);
      return response;
    } catch (error) {
      console.error('Error fetching user:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Try to refresh token
        const refreshSuccess = await authAPI.refreshToken();
        if (refreshSuccess) {
          // Retry the request
          return await api.get(`/api/user/${userId}`);
        }
      }
      throw error;
    }
  },
  updateUser: async (userId, userData) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No authentication token found');
      }

      const response = await api.post(`/api/user/update/${userId}`, userData, {
        ...(userData instanceof FormData ? {} : { 'Content-Type': 'application/json' })
      });
      return response;
    } catch (error) {
      console.error('Error updating user:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Try to refresh token
        const refreshSuccess = await authAPI.refreshToken();
        if (refreshSuccess) {
          // Retry the request
          return await api.post(`/api/user/update/${userId}`, userData, {
            ...(userData instanceof FormData ? {} : { 'Content-Type': 'application/json' })
          });
        }
      }
      throw error;
    }
  },
};

// Listing APIs
export const listingAPI = {
  createListing: async (listingData) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No authentication token found');
      }

      const response = await api.post('/api/listing/create', listingData);
      return response;
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Try to refresh token
        const refreshSuccess = await authAPI.refreshToken();
        if (refreshSuccess) {
          // Retry the request
          return await api.post('/api/listing/create', listingData);
        }
      }
      throw error;
    }
  },
  uploadImages: async (formData) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No authentication token found');
      }

      const response = await api.post('/api/listing/upload-images', formData);
      return response;
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Try to refresh token
        const refreshSuccess = await authAPI.refreshToken();
        if (refreshSuccess) {
          // Retry the request
          return await api.post('/api/listing/upload-images', formData);
        }
      }
      throw error;
    }
  },
  getListings: (params) => api.get('/api/listing/get', { params }),
  getListing: (id) => api.get(`/api/listing/get/${id}`),
  updateListing: (id, listingData) => api.post(`/api/listing/update/${id}`, listingData),
  deleteListing: (id) => api.delete(`/api/listing/delete/${id}`),
};

// Property Valuation API
export const valuationAPI = {
  getValuation: (propertyData) => api.post('/api/listing/valuation', propertyData),
};

// Notification APIs
export const notificationAPI = {
  getUserNotifications: (userId) => api.get(`/api/notification/${userId}`),
  markAsRead: (notificationId) => api.put(`/api/notification/${notificationId}/read`),
  markAllAsRead: () => api.put('/api/notification/read-all'),
  deleteNotification: (notificationId) => api.delete(`/api/notification/${notificationId}`),
  deleteMultipleNotifications: (notificationIds) => api.delete('/api/notification/multiple', { data: { notificationIds } }),
  deleteAllNotifications: () => api.delete('/api/notification/all'),
  testNotification: (data) => api.post('/api/notification/test', data),
};

// Marketplace API
export const marketplaceAPI = {
  getListings: async (params) => {
    return api.get('/marketplace', { params });
  },

  getListing: async (id) => {
    return api.get(`/marketplace/${id}`);
  },

  createListing: async (listingData) => {
    return api.post('/marketplace', listingData);
  },

  updateListing: async (id, listingData) => {
    return api.put(`/marketplace/${id}`, listingData);
  },

  deleteListing: async (id) => {
    return api.delete(`/marketplace/${id}`);
  },

  // AI-powered features
  getPriceRecommendation: async (listingData) => {
    return api.post('/marketplace/price-recommendation', listingData);
  },

  predictCategory: async (listingData) => {
    return api.post('/marketplace/predict-category', listingData);
  },

  getImageRecommendations: async (listingData) => {
    return api.post('/marketplace/image-recommendations', listingData);
  },

  analyzeImage: async (imageData) => {
    return api.post('/marketplace/analyze-image', imageData);
  },

  // AI-powered search
  searchListings: async (query) => {
    try {
      const response = await api.get('/api/marketplace/search', { 
        params: { query },
        headers: {
          'X-AI-Search': 'true'
        }
      });
      return response;
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        const refreshSuccess = await authAPI.refreshToken();
        if (refreshSuccess) {
          const response = await api.get('/api/marketplace/search', { 
            params: { query },
            headers: {
              'X-AI-Search': 'true'
            }
          });
          return response;
        }
      }
      throw error;
    }
  },
};

export default api; 