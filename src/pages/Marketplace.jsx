import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { marketplaceAPI } from '../services/marketplace';
import { useAuth } from '../context/AuthContext';
import Container from '../components/Container';
import LoadingSpinner from '../components/LoadingSpinner';
import { showNotification } from '../utils/notifications.jsx';

// Base64 encoded placeholder image (1x1 transparent pixel)
const FALLBACK_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// Reliable placeholder image service
const DEFAULT_IMAGE = 'https://placehold.co/400x300/e2e8f0/1e293b?text=No+Image';

const Marketplace = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    propertyType: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    location: '',
    sort: 'createdAt',
    order: 'desc',
    page: 1,
    limit: 10
  });
  const [totalPages, setTotalPages] = useState(1);
  const { currentUser } = useAuth();

  useEffect(() => {
    // Check URL parameters for sort option
    const params = new URLSearchParams(window.location.search);
    const sortParam = params.get('sort');
    if (sortParam === 'trending') {
      setFilters(prev => ({
        ...prev,
        sort: 'views',
        order: 'desc'
      }));
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [filters]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      let data;
      
      if (searchQuery) {
        // Use AI-powered semantic search
        const response = await marketplaceAPI.searchListings(searchQuery);
        data = {
          listings: response.data.listings,
          total: response.data.total,
          currentPage: 1,
          totalPages: Math.ceil(response.data.total / filters.limit)
        };
      } else {
        // Use regular filtered search
        data = await marketplaceAPI.getListings(filters);
      }
      
      // Ensure each listing has the required fields
      const processedListings = data.listings.map(listing => ({
        ...listing,
        images: Array.isArray(listing.images) && listing.images.length > 0 
          ? listing.images 
          : [DEFAULT_IMAGE],
        price: listing.price || 0,
        title: listing.title || 'Untitled Listing',
        location: listing.location || 'Location not specified',
        category: listing.category || 'Uncategorized',
        condition: listing.condition || 'Not specified'
      }));
      
      setListings(processedListings);
      setTotalPages(data.totalPages);
      setError(null);
    } catch (err) {
      setError('Failed to fetch listings. Please try again later.');
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setFilters(prev => ({ ...prev, page: 1 }));
      await fetchListings();
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  if (loading) {
    return (
      <Container className="text-center py-8">
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 mt-4">Loading marketplace items...</p>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <Link
            to="/marketplace/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Create Listing
          </Link>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search listings with natural language..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Try searching with natural language like "affordable apartments near downtown" or "gaming laptop in good condition"
          </p>
        </form>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <select
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Types</option>
            <option value="property">Property</option>
            <option value="vehicle">Vehicle</option>
            <option value="electronics">Electronics</option>
            <option value="furniture">Furniture</option>
            <option value="other">Other</option>
          </select>

          <select
            name="sort"
            value={filters.sort}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="createdAt">Newest First</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
          </select>

          <input
            type="number"
            name="minPrice"
            value={filters.minPrice}
            onChange={handleFilterChange}
            placeholder="Min Price"
            className="border border-gray-300 rounded-lg px-3 py-2"
          />

          <input
            type="number"
            name="maxPrice"
            value={filters.maxPrice}
            onChange={handleFilterChange}
            placeholder="Max Price"
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        {/* Listings Grid */}
        {error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">No listings found. Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Link
                key={listing._id}
                to={`/marketplace/${listing._id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative h-48">
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      // Try the fallback image if the default image fails
                      if (e.target.src === DEFAULT_IMAGE) {
                        e.target.src = FALLBACK_IMAGE;
                      } else {
                        e.target.src = DEFAULT_IMAGE;
                      }
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-sm font-medium">
                    ${listing.price.toLocaleString()}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{listing.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{listing.location}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{listing.category}</span>
                    <span className="text-sm text-gray-500">{listing.condition}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-4 py-2 rounded ${
                  filters.page === page
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export default Marketplace; 