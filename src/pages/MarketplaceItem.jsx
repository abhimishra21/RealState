import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marketplaceAPI } from '../services/marketplace';
import { useAuth } from '../context/AuthContext';
import Container from '../components/Container';
import LoadingSpinner from '../components/LoadingSpinner';
import { showNotification } from '../utils/notifications.jsx';

const MarketplaceItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!id) {
      setError('Invalid listing ID');
      setLoading(false);
      return;
    }
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      const response = await marketplaceAPI.getListing(id);
      if (response.data) {
        setListing(response.data);
        setError(null);
      } else {
        setError('Listing not found');
      }
    } catch (err) {
      console.error('Error fetching listing:', err);
      if (err.response?.status === 400) {
        setError('Invalid listing ID format');
      } else if (err.response?.status === 404) {
        setError('Listing not found');
      } else {
        setError('Failed to fetch listing details. Please try again later.');
      }
      showNotification(err.response?.data?.message || 'Error loading listing', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      await marketplaceAPI.deleteListing(id);
      showNotification('Listing deleted successfully', { variant: 'success' });
      navigate('/marketplace');
    } catch (err) {
      console.error('Error deleting listing:', err);
      showNotification('Failed to delete listing. Please try again.', { variant: 'error' });
    }
  };

  const handleEdit = () => {
    navigate(`/marketplace/edit/${id}`);
  };

  if (loading) {
    return (
      <Container className="text-center py-8">
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 mt-4">Loading listing details...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="text-center py-8">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold mb-4">{error}</p>
          <button
            onClick={() => navigate('/marketplace')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Marketplace
          </button>
        </div>
      </Container>
    );
  }

  if (!listing) {
    return (
      <Container className="text-center py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Listing not found</h2>
          <button
            onClick={() => navigate('/marketplace')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Marketplace
          </button>
        </div>
      </Container>
    );
  }

  const isOwner = currentUser && listing.userRef._id === currentUser._id;

  return (
    <Container>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative h-96">
                <img
                  src={listing.imageUrls[currentImageIndex]}
                  alt={listing.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              {listing.imageUrls.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {listing.imageUrls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative h-24 ${
                        currentImageIndex === index
                          ? 'ring-2 ring-blue-500'
                          : 'hover:opacity-75'
                      }`}
                    >
                      <img
                        src={url}
                        alt={`${listing.name} ${index + 1}`}
                        className="w-full h-full object-cover rounded"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Listing Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{listing.name}</h1>
                <p className="text-gray-600 mt-2">{listing.address}</p>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-2xl font-bold text-blue-600">
                  ${listing.regularPrice.toLocaleString()}
                </span>
                {listing.offer && (
                  <span className="text-xl text-gray-500 line-through">
                    ${listing.discountPrice.toLocaleString()}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2 font-medium capitalize">{listing.type}</span>
                </div>
                <div>
                  <span className="text-gray-600">Bedrooms:</span>
                  <span className="ml-2 font-medium">{listing.bedrooms}</span>
                </div>
                <div>
                  <span className="text-gray-600">Bathrooms:</span>
                  <span className="ml-2 font-medium">{listing.bathrooms}</span>
                </div>
                <div>
                  <span className="text-gray-600">Furnished:</span>
                  <span className="ml-2 font-medium">{listing.furnished ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Parking:</span>
                  <span className="ml-2 font-medium">{listing.parking ? 'Yes' : 'No'}</span>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{listing.description}</p>
              </div>

              {isOwner && (
                <div className="flex space-x-4">
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Edit Listing
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete Listing
                  </button>
                </div>
              )}

              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                <div className="flex items-center space-x-4">
                  <img
                    src={listing.userRef.avatar || '/default-avatar.png'}
                    alt={listing.userRef.username}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{listing.userRef.username}</p>
                    <p className="text-gray-600">{listing.userRef.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default MarketplaceItem; 