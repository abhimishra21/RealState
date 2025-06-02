import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { marketplaceAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Container from '../components/Container';
import LoadingSpinner from '../components/LoadingSpinner';
import { showNotification } from '../utils/notifications.jsx';

const MarketplaceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAuthenticated, user, checkAuth } = useAuth();
  const isEditing = Boolean(id);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [priceRecommendation, setPriceRecommendation] = useState(null);
  const [imageRecommendations, setImageRecommendations] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: '',
    location: '',
    images: [],
    contactInfo: {
      phone: '',
      email: '',
    },
  });

  useEffect(() => {
    const initializeForm = async () => {
      try {
        // Check authentication
        const isAuth = await checkAuth();
        if (!isAuth) {
          showNotification('Please sign in to create or edit listings', { variant: 'error' });
          navigate('/auth');
          return;
        }

        // Set default contact info from user data
        if (user) {
          setFormData(prev => ({
            ...prev,
            contactInfo: {
              phone: user.phone || '',
              email: user.email || '',
            }
          }));
        }

        if (isEditing) {
          await fetchListing();
        }
      } catch (error) {
        console.error('Error initializing form:', error);
        showNotification('Failed to initialize form. Please try again.', { variant: 'error' });
        navigate('/marketplace');
      } finally {
        setLoading(false);
      }
    };

    initializeForm();
  }, [id, isAuthenticated, user, checkAuth]);

  // Get AI recommendations when title, description, or images change
  useEffect(() => {
    const getAIRecommendations = async () => {
      if (formData.title && formData.description) {
        try {
          console.log('Fetching AI recommendations...');
          // Get price recommendation
          const priceResponse = await marketplaceAPI.getPriceRecommendation({
            title: formData.title,
            description: formData.description,
            category: formData.category,
            condition: formData.condition
          });
          console.log('Price recommendation:', priceResponse.data);
          setPriceRecommendation(priceResponse.data);

          // Get category prediction if not set
          if (!formData.category) {
            console.log('Predicting category...');
            const categoryResponse = await marketplaceAPI.predictCategory({
              title: formData.title,
              description: formData.description
            });
            console.log('Category prediction:', categoryResponse.data);
            if (categoryResponse.data.suggestedCategory) {
              setFormData(prev => ({
                ...prev,
                category: categoryResponse.data.suggestedCategory
              }));
            }
          }

          // Get image recommendations if we have at least one image
          if (formData.images.length > 0) {
            console.log('Getting image recommendations...');
            const imageResponse = await marketplaceAPI.getImageRecommendations({
              title: formData.title,
              description: formData.description,
              category: formData.category,
              currentImages: formData.images
            });
            console.log('Image recommendations:', imageResponse.data);
            setImageRecommendations(imageResponse.data.recommendations);
          }
        } catch (err) {
          console.error('Error getting AI recommendations:', err);
          showNotification('Failed to get AI recommendations', { variant: 'error' });
        }
      }
    };

    const timeoutId = setTimeout(getAIRecommendations, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData.title, formData.description, formData.category, formData.condition, formData.images]);

  const fetchListing = async () => {
    try {
      const response = await marketplaceAPI.getListing(id);
      setFormData(response.data);
    } catch (err) {
      console.error('Error fetching listing:', err);
      showNotification('Failed to load listing details.', { variant: 'error' });
      navigate('/marketplace');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const analyzeImageWithAI = async (imageData) => {
    try {
      setAiAnalyzing(true);
      const response = await marketplaceAPI.analyzeImage(imageData);
      
      // Update form with AI suggestions
      setFormData(prev => ({
        ...prev,
        title: response.data.suggestedTitle || prev.title,
        description: response.data.suggestedDescription || prev.description,
        category: response.data.suggestedCategory || prev.category,
        price: response.data.suggestedPrice || prev.price,
      }));

      showNotification('AI analysis complete! Suggestions have been applied.', { variant: 'success' });
    } catch (err) {
      console.error('Error analyzing image:', err);
      showNotification('Failed to analyze image with AI.', { variant: 'error' });
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const imagePromises = files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises)
      .then(images => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...images]
        }));
        
        // Analyze the first image with AI
        if (images.length > 0) {
          analyzeImageWithAI(images[0]);
        }
      })
      .catch(err => {
        console.error('Error processing images:', err);
        showNotification('Failed to process images.', { variant: 'error' });
      });
  };

  const addRecommendedImage = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, e.target.result]
        }));
      };
      reader.readAsDataURL(blob);
      showNotification('Recommended image added successfully', { variant: 'success' });
    } catch (err) {
      console.error('Error adding recommended image:', err);
      showNotification('Failed to add recommended image', { variant: 'error' });
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Check authentication before submitting
      const isAuth = await checkAuth();
      if (!isAuth) {
        showNotification('Please sign in to create or edit listings', { variant: 'error' });
        navigate('/auth');
        return;
      }

      setSubmitting(true);

      if (isEditing) {
        await marketplaceAPI.updateListing(id, formData);
        showNotification('Listing updated successfully', { variant: 'success' });
      } else {
        await marketplaceAPI.createListing(formData);
        showNotification('Listing created successfully', { variant: 'success' });
      }
      navigate('/marketplace');
    } catch (err) {
      console.error('Error saving listing:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        showNotification('Your session has expired. Please sign in again.', { variant: 'error' });
        navigate('/auth');
      } else {
        showNotification(err.response?.data?.message || 'Failed to save listing.', { variant: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-8">
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 mt-4">Loading listing details...</p>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-8">
        <h1 className="text-3xl font-bold mb-8">
          {isEditing ? 'Edit Listing' : 'Create New Listing'}
        </h1>

        {aiAnalyzing && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <LoadingSpinner size="sm" className="mr-2" />
              <span className="text-blue-600">AI is analyzing your content and generating suggestions...</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                {priceRecommendation && (
                  <div className="absolute right-0 top-full mt-1 p-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <p className="text-sm text-gray-600">AI Price Recommendation:</p>
                    <p className="text-sm font-medium">
                      ${priceRecommendation.minPrice} - ${priceRecommendation.maxPrice}
                    </p>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        price: priceRecommendation.minPrice
                      }))}
                      className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      Use minimum price
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Select a category</option>
                <option value="property">Property</option>
                <option value="vehicle">Vehicle</option>
                <option value="electronics">Electronics</option>
                <option value="furniture">Furniture</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Select condition</option>
                <option value="new">New</option>
                <option value="like-new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Images
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <button
                type="button"
                onClick={() => analyzeImageWithAI(formData.images[0])}
                disabled={!formData.images.length || aiAnalyzing}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {aiAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
              </button>
            </div>
            {formData.images.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Price Recommendation */}
          {priceRecommendation && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-2">AI Price Recommendation</h3>
              <p className="text-green-700">
                Based on similar listings, we recommend a price range of:
                <span className="font-bold ml-2">
                  ${priceRecommendation.minPrice} - ${priceRecommendation.maxPrice}
                </span>
              </p>
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  price: priceRecommendation.minPrice
                }))}
                className="mt-2 text-sm text-green-600 hover:text-green-800"
              >
                Use minimum recommended price
              </button>
            </div>
          )}

          {/* Image Recommendations */}
          {imageRecommendations && imageRecommendations.length > 0 && (
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-800 mb-2">AI Image Recommendations</h3>
              <p className="text-purple-700 mb-4">
                Based on your listing, we recommend adding these images to improve visibility:
              </p>
              <div className="grid grid-cols-3 gap-4">
                {imageRecommendations.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.url}
                      alt={`Recommended ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => addRecommendedImage(image.url)}
                      className="absolute inset-0 bg-black bg-opacity-50 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                    >
                      Add Image
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="contactInfo.phone"
                  value={formData.contactInfo.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="contactInfo.email"
                  value={formData.contactInfo.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/marketplace')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                isEditing ? 'Update Listing' : 'Create Listing'
              )}
            </button>
          </div>
        </form>
      </div>
    </Container>
  );
};

export default MarketplaceForm; 