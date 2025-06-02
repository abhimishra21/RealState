import React, { useEffect, useState } from 'react';
import { marketplaceAPI } from '../services/api';
import Container from './Container';
import LoadingSpinner from './LoadingSpinner';
import { showNotification } from '../utils/notifications.jsx';
import { Link } from 'react-router-dom';

const MarketplaceProperties = ({ limit }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await marketplaceAPI.getListings({ limit: limit });
        setItems(limit ? response.data.slice(0, limit) : response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching marketplace items:', err);
        setError(err.message);
        setLoading(false);
        showNotification('Failed to load marketplace items.', { variant: 'error' });
      }
    };

    fetchItems();
  }, [limit]);

  if (loading) {
    return (
      <Container className="text-center py-8">
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 mt-4">Loading marketplace items...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="text-center py-8">
        <div className="text-red-500 font-bold text-lg">Error loading items:</div>
        <div className="text-red-500">{error}</div>
        <p className="text-gray-500 mt-4">Please try refreshing the page or check your network connection.</p>
      </Container>
    );
  }

  return (
    <Container>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Marketplace</h2>
        <Link 
          to="/marketplace" 
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          View All →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div 
            key={item._id} 
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            <div className="relative h-48">
              <img 
                src={item.images[0]} 
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-sm font-medium">
                ${item.price}
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm mb-2">{item.location}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{item.category}</span>
                <span className="text-sm text-gray-500">{item.condition}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <p className="text-center text-gray-500 text-lg py-8">No items available in the marketplace.</p>
      )}
    </Container>
  );
};

export default MarketplaceProperties; 