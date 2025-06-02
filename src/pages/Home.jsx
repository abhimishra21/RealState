import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { marketplaceAPI } from '../services/api';
import Container from '../components/Container';
import LoadingSpinner from '../components/LoadingSpinner';
import { showNotification } from '../utils/notifications.jsx';
import HeroSection from "../components/home/HeroSection";
import ClientTestimonials from "../components/ClientTestimonials";
import ProjectsSection from "../components/home/ProjectsSection";
import AboutUs from "../components/AboutUs";
import RequestCallback from "../components/RequestCallback";
import MarketplaceProperties from "../components/MarketplaceProperties";

const Home = () => {
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeaturedItems();
  }, []);

  const fetchFeaturedItems = async () => {
    try {
      setLoading(true);
      const response = await marketplaceAPI.getListings({ limit: 6 });
      setFeaturedItems(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching featured items:', err);
      setError(err.message);
      setLoading(false);
      showNotification('Failed to load featured items.', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-8">
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 mt-4">Loading featured items...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="text-center py-8">
        <div className="text-red-500 font-bold text-lg">Error loading featured items:</div>
        <div className="text-red-500">{error}</div>
        <p className="text-gray-500 mt-4">Please try refreshing the page or check your network connection.</p>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to TopReal</h1>
          <p className="text-xl text-gray-600 mb-8">
            Your one-stop platform for real estate and marketplace listings
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/create-listing"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Listing
            </Link>
            <Link
              to="/marketplace"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>

        {/* Featured Marketplace Items */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Featured Marketplace Items</h2>
            <Link
              to="/marketplace"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredItems.map((item) => (
              <Link
                key={item._id}
                to={`/marketplace/${item._id}`}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-xl font-bold text-blue-600 mb-2">${item.price}</p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span className="capitalize">{item.category}</span>
                    <span className="capitalize">{item.condition}</span>
                  </div>
                  <p className="text-gray-600 mt-2 line-clamp-2">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>

          {featuredItems.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No featured items available.</p>
              <Link
                to="/marketplace/create"
                className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
              >
                Be the first to create a listing!
              </Link>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Real Estate Listings</h3>
            <p className="text-gray-600">
              Browse through our extensive collection of real estate properties
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Marketplace</h3>
            <p className="text-gray-600">
              Buy and sell items in our secure marketplace platform
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Property Valuation</h3>
            <p className="text-gray-600">
              Get accurate property valuations using our advanced tools
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-blue-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-6">
            Join our community and start exploring real estate opportunities today
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/create-listing"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Listing
            </Link>
            <Link
              to="/marketplace"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Explore Marketplace
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Home;
