import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHome, FaBed, FaBath, FaRuler, FaCalendar, FaTools, FaHammer } from 'react-icons/fa';
import { valuationAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

export default function PropertyValuation() {
  const [formData, setFormData] = useState({
    bedrooms: '',
    bathrooms: '',
    squareFootage: '',
    yearBuilt: '',
    condition: 'good',
    maintenanceLevel: 'good',
    renovationStatus: 'standard',
  });
  const [valuation, setValuation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setValuation(null);

    try {
      const valuationData = {
        ...formData,
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        squareFootage: Number(formData.squareFootage),
        yearBuilt: Number(formData.yearBuilt),
      };

      const response = await valuationAPI.getValuation(valuationData);
      setValuation(response.data);
    } catch (err) {
      console.error('Valuation error:', err);
      setError(err.response?.data?.message || 'Failed to get property valuation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8">
        <motion.h1 
          variants={itemVariants}
          className="text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center"
        >
          <FaHome className="mr-3" />
          Property Valuation
        </motion.h1>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg relative"
              role="alert"
            >
              <span className="block sm:inline">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-8">
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bedrooms
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">
                  <FaBed />
                </span>
                <input
                  type="number"
                  name="bedrooms"
                  required
                  value={formData.bedrooms}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Number of bedrooms"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bathrooms
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">
                  <FaBath />
                </span>
                <input
                  type="number"
                  name="bathrooms"
                  required
                  value={formData.bathrooms}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Number of bathrooms"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Square Footage
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">
                  <FaRuler />
                </span>
                <input
                  type="number"
                  name="squareFootage"
                  required
                  value={formData.squareFootage}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Total square feet"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Year Built
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">
                  <FaCalendar />
                </span>
                <input
                  type="number"
                  name="yearBuilt"
                  required
                  value={formData.yearBuilt}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Year built"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Condition
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Maintenance Level
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">
                  <FaTools />
                </span>
                <select
                  name="maintenanceLevel"
                  value={formData.maintenanceLevel}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Renovation Status
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">
                  <FaHammer />
                </span>
                <select
                  name="renovationStatus"
                  value={formData.renovationStatus}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="luxury">Luxury</option>
                  <option value="standard">Standard</option>
                  <option value="basic">Basic</option>
                </select>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>Calculating...</span>
                </div>
              ) : (
                'Get Valuation'
              )}
            </button>
          </motion.div>
        </form>

        <AnimatePresence>
          {valuation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Estimated Value</h2>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                ${valuation.estimatedValue.toLocaleString()}
              </p>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Based on the provided property details and current market conditions.
              </p>
              {valuation.confidence && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Confidence Score: {valuation.confidence}%
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
} 