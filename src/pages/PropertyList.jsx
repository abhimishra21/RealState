import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingAPI } from '../services/api';
import { useSnackbar } from 'notistack';
import { FaSearch, FaBed, FaBath, FaParking, FaCouch } from 'react-icons/fa';

export default function PropertyList() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [error, setError] = useState(null);

  // Sample data for fallback
  const sampleData = [
    {
      _id: '1',
      name: 'Modern Apartment',
      description: 'Beautiful modern apartment in the city center',
      address: '123 Main St',
      regularPrice: 2000,
      discountPrice: 1800,
      bathrooms: 2,
      bedrooms: 2,
      furnished: true,
      parking: true,
      type: 'rent',
      offer: true,
      imageUrls: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
    },
    // Add more sample properties as needed
  ];

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await listingAPI.getListings();
      
      if (response.data && response.data.length > 0) {
        setProperties(response.data);
      } else {
        enqueueSnackbar('No properties found', { 
          variant: 'info',
          preventDuplicate: true 
        });
        setProperties(sampleData);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError(error.message);
      enqueueSnackbar('Error loading properties. Using sample data.', { 
        variant: 'warning',
        preventDuplicate: true 
      });
      setProperties(sampleData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Loading properties...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Error Loading Properties</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">{error}</p>
            <button
              onClick={fetchProperties}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
            Available Properties
          </h1>
          <p className="mt-5 text-xl text-gray-500 dark:text-gray-400">
            Find your perfect home from our curated list of properties
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <div
              key={property._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="relative h-48">
                <img
                  src={property.imageUrls[0]}
                  alt={property.name}
                  className="w-full h-full object-cover"
                />
                {property.offer && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-sm">
                    Offer
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {property.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {property.description}
                </p>
                <div className="flex items-center text-gray-500 dark:text-gray-400 mb-4">
                  <FaBed className="mr-2" />
                  <span className="mr-4">{property.bedrooms} beds</span>
                  <FaBath className="mr-2" />
                  <span className="mr-4">{property.bathrooms} baths</span>
                  {property.parking && (
                    <>
                      <FaParking className="mr-2" />
                      <span className="mr-4">Parking</span>
                    </>
                  )}
                  {property.furnished && (
                    <>
                      <FaCouch className="mr-2" />
                      <span>Furnished</span>
                    </>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      ${property.regularPrice}
                    </p>
                    {property.offer && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-through">
                        ${property.discountPrice}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(`/listing/${property._id}`)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 