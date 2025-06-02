import { FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt } from 'react-icons/fa';
import { useState } from 'react';

const PropertyCard = ({ property, isMarketplace }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const {
    title,
    price,
    location,
    image,
    bedrooms,
    bathrooms,
    area,
    category,
    description
  } = property;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
      <div className="relative h-40 sm:h-48 bg-gray-200 dark:bg-gray-700">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <img
          src={image}
          alt={title}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
        />
        <div className="absolute top-2 right-2 bg-primary-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium shadow-md">
          {category}
        </div>
      </div>
      
      <div className="p-3 sm:p-5">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-1 sm:mb-2 line-clamp-1">{title}</h3>
        <p className="text-primary-500 font-bold text-xl sm:text-2xl mb-2 sm:mb-3">${price.toLocaleString()}</p>
        
        <div className="flex items-center text-gray-600 dark:text-gray-300 mb-2 sm:mb-3">
          <FaMapMarkerAlt className="mr-1.5 sm:mr-2 text-primary-500 text-sm sm:text-base" />
          <span className="line-clamp-1 text-sm sm:text-base">{location}</span>
        </div>
        
        <div className="flex justify-between text-gray-600 dark:text-gray-300 mb-3 sm:mb-4 text-xs sm:text-sm">
          <div className="flex items-center">
            <FaBed className="mr-1.5 sm:mr-2 text-primary-500" />
            <span>{bedrooms} beds</span>
          </div>
          <div className="flex items-center">
            <FaBath className="mr-1.5 sm:mr-2 text-primary-500" />
            <span>{bathrooms} baths</span>
          </div>
          <div className="flex items-center">
            <FaRulerCombined className="mr-1.5 sm:mr-2 text-primary-500" />
            <span>{area} sqft</span>
          </div>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm line-clamp-2">{description}</p>
        
        {isMarketplace && (
          <div className="mt-4 sm:mt-5 flex justify-between space-x-2">
            <button className="flex-1 bg-green-500 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-green-600 transition-colors duration-200">Buy</button>
            <button className="flex-1 bg-blue-500 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors duration-200">Sell</button>
            <button className="flex-1 bg-purple-500 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-purple-600 transition-colors duration-200">Auction</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyCard; 