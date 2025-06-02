import api from './api';

export const marketplaceAPI = {
  // Get all listings with optional filters
  getListings: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await api.get(`/api/marketplace/get?${queryParams}`);
    return response.data;
  },

  // Get a single listing by ID
  getListing: async (id) => {
    const response = await api.get(`/api/marketplace/get/${id}`);
    return response.data;
  },

  // Create a new listing
  createListing: async (listingData) => {
    const response = await api.post('/api/marketplace/create', listingData);
    return response.data;
  },

  // Update a listing
  updateListing: async (id, listingData) => {
    const response = await api.post(`/api/marketplace/update/${id}`, listingData);
    return response.data;
  },

  // Delete a listing
  deleteListing: async (id) => {
    const response = await api.delete(`/api/marketplace/delete/${id}`);
    return response.data;
  },
}; 