import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI, listingAPI } from '../services/api';
import ProtectedRoute from '../components/ProtectedRoute';
import { FaUser, FaEnvelope, FaCalendarAlt, FaBuilding, FaEdit, FaCamera } from 'react-icons/fa';
import { useSnackbar } from 'notistack';
import TestNotifications from '../components/TestNotifications';

export default function Profile() {
  const { user } = useAuth();
  const [userInfo, setUserInfo] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        if (!user?._id) {
          throw new Error('No user ID available');
        }
        
        const response = await userAPI.getUser(user._id);
        if (response.data) {
          setUserInfo(response.data);
        } else {
          throw new Error('No user data received');
        }
      } catch (err) {
        console.error('Error fetching user info:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch user information';
        setError(errorMessage);
        enqueueSnackbar(errorMessage, { 
          variant: 'error',
          preventDuplicate: true 
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchUserListings = async () => {
      try {
        if (!user?._id) return;
        
        const response = await listingAPI.getListings({ userRef: user._id });
        if (response.data) {
          setListings(response.data);
        }
      } catch (err) {
        console.error('Error fetching listings:', err);
        enqueueSnackbar('Failed to fetch your listings', { 
          variant: 'error',
          preventDuplicate: true 
        });
      }
    };

    if (user) {
      fetchUserInfo();
      fetchUserListings();
    } else {
      setLoading(false);
      setError('No user information available');
      enqueueSnackbar('Please login to view your profile', { 
        variant: 'error',
        preventDuplicate: true 
      });
    }
  }, [user, enqueueSnackbar]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      enqueueSnackbar('Please select an image file', { variant: 'error' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      enqueueSnackbar('Image size should be less than 5MB', { variant: 'error' });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await userAPI.updateUser(user._id, formData);
      if (response.data) {
        setUserInfo(response.data);
        enqueueSnackbar('Profile image updated successfully', { variant: 'success' });
      } else {
        throw new Error('No response data received');
      }
    } catch (err) {
      console.error('Error updating profile image:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update profile image';
      enqueueSnackbar(errorMessage, { 
        variant: 'error',
        preventDuplicate: true 
      });
    } finally {
      setUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* User Info Section */}
            <div className="md:col-span-2">
              <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                  {/* Profile Header */}
                  <div className="bg-indigo-600 px-6 py-8 text-white">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="relative h-24 w-24 rounded-full bg-white p-1 cursor-pointer group"
                        onClick={handleImageClick}
                      >
                        <img
                          src={userInfo?.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                          alt="Profile"
                          className="h-full w-full rounded-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <FaCamera className="text-white text-2xl" />
                        </div>
                        {uploading && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                          </div>
                        )}
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold">{userInfo?.username || user?.username}</h1>
                        <p className="text-indigo-200">{userInfo?.email || user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Profile Content */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Personal Information */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                          <FaUser className="mr-2" />
                          Personal Information
                        </h2>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Username</label>
                            <p className="mt-1 text-gray-900 dark:text-white">{userInfo?.username || user?.username}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Email</label>
                            <p className="mt-1 text-gray-900 dark:text-white">{userInfo?.email || user?.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Account Information */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                          <FaCalendarAlt className="mr-2" />
                          Account Information
                        </h2>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Member Since</label>
                            <p className="mt-1 text-gray-900 dark:text-white">
                              {userInfo?.createdAt ? new Date(userInfo.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Account Status</label>
                            <p className="mt-1 text-green-600 dark:text-green-400">Active</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* User Listings */}
                    <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                      <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <FaBuilding className="mr-2" />
                        Your Listings
                      </h2>
                      {listings && listings.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {listings.map((listing) => (
                            <div key={listing._id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                              <h3 className="font-semibold">{listing.name}</h3>
                              <p className="text-gray-600 dark:text-gray-300">{listing.address}</p>
                              <p className="text-indigo-600 dark:text-indigo-400">${listing.regularPrice}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600 dark:text-gray-300">No listings found. Create your first listing!</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Notifications Section */}
            <div className="md:col-span-1">
              <TestNotifications />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 