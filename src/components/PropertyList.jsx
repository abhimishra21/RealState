import { useState, useEffect } from 'react';
import PropertyCard from './PropertyCard';
import PropertyFilter from './PropertyFilter';

// Import all images for the requested categories
// Administrative Images
import admin1 from '../Assets/administrative.jpg';
import admin2 from '../Assets/administrative1.jpg';
import admin3 from '../Assets/administrative2.jpg';
import admin4 from '../Assets/administrative3.jpg';
import admin5 from '../Assets/administrative4.jpeg';
import admin6 from '../Assets/administrative5.jpg';
import admin7 from '../Assets/administrative6.jpg';

// Apartment Images
import apt1 from '../Assets/Apartment.jpg';
import apt2 from '../Assets/apartemn1.jpg';
import apt3 from '../Assets/apartemn2.jpg';
import apt4 from '../Assets/apartemn3.jpg';
import apt5 from '../Assets/apartemn4.jpeg';
import apt6 from '../Assets/apartemn5.jpg';
import apt7 from '../Assets/apartemn6.jpeg';

// Commercial Images
import comm1 from '../Assets/commercial-1.jpg';
import comm2 from '../Assets/commercial1.jpg';
import comm3 from '../Assets/commercial2.jpeg';
import comm4 from '../Assets/commercial3.jpg';
import comm5 from '../Assets/commercial4.jpg';
import comm6 from '../Assets/commercial5.jpg';
import comm7 from '../Assets/commercial6.jpeg';

// Pharmacies Images
import pharm1 from '../Assets/pharmacies1.jpg';
import pharm2 from '../Assets/pharmacies2.jpg';
import pharm3 from '../Assets/pharmacies3.jpg';
import pharm4 from '../Assets/pharmacies4.jpg';
import pharm5 from '../Assets/pharmacies5.jpg';
import pharm6 from '../Assets/pharmacies6.jpg';
import pharm7 from '../Assets/woman-working-pharmacy-wearing-coat.jpg';

// Hotel Apartment Images
import hotelApt1 from '../Assets/hotel-apartment.jpg';
import hotelApt2 from '../Assets/villa1.jpg';
import hotelApt3 from '../Assets/villa2.jpg';
import hotelApt4 from '../Assets/villa3.jpeg';
import hotelApt5 from '../Assets/villa4.jpeg';
import hotelApt6 from '../Assets/villa5.jpg';

// Medical Images
import medical1 from '../Assets/medical.jpg';
import medical2 from '../Assets/medical1.jpg';
import medical3 from '../Assets/medical2.png';
import medical4 from '../Assets/medical3.png';
import medical5 from '../Assets/medical4.jpg';
import medical6 from '../Assets/medical5.jpg';
import medical7 from '../Assets/medical6.jpg';

// Sample data including a property for each imported image
const sampleProperties = [
  // Administrative Properties (7 images)
  { _id: 'admin-1', title: 'Administrative Space 1', price: 400000, location: 'Business Park', image: admin1, bedrooms: 0, bathrooms: 1, area: 800, category: 'Administrative', description: 'Modern administrative space with excellent facilities.' },
  { _id: 'admin-2', title: 'Administrative Office 2', price: 420000, location: 'City Center', image: admin2, bedrooms: 0, bathrooms: 1, area: 850, category: 'Administrative', description: 'Well-located administrative office in the city center.' },
  { _id: 'admin-3', title: 'Administrative Unit 3', price: 450000, location: 'Office Complex', image: admin3, bedrooms: 0, bathrooms: 2, area: 900, category: 'Administrative', description: 'Spacious administrative unit in a professional complex.' },
  { _id: 'admin-4', title: 'Administrative Space 4', price: 480000, location: 'Tech Hub', image: admin4, bedrooms: 0, bathrooms: 2, area: 950, category: 'Administrative', description: 'Administrative space in a vibrant tech hub.' },
  { _id: 'admin-5', title: 'Administrative Office 5', price: 500000, location: 'Financial District', image: admin5, bedrooms: 0, bathrooms: 1, area: 1000, category: 'Administrative', description: 'Premium administrative office in the financial district.' },
  { _id: 'admin-6', title: 'Administrative Unit 6', price: 520000, location: 'Suburb Business Area', image: admin6, bedrooms: 0, bathrooms: 2, area: 1050, category: 'Administrative', description: 'Administrative unit in a growing suburban business area.' },
  { _id: 'admin-7', title: 'Administrative Space 7', price: 550000, location: 'Commercial Zone', image: admin7, bedrooms: 0, bathrooms: 2, area: 1100, category: 'Administrative', description: 'Versatile administrative space in a key commercial zone.' },

  // Apartment Properties (7 images)
  { _id: 'apt-1', title: 'Downtown Apartment', price: 300000, location: 'City Center', image: apt1, bedrooms: 1, bathrooms: 1, area: 700, category: 'Apartment', description: 'Cozy apartment in the heart of the city.' },
  { _id: 'apt-2', title: 'Modern Apartment 2', price: 320000, location: 'Urban Area', image: apt2, bedrooms: 2, bathrooms: 1, area: 800, category: 'Apartment', description: 'Modern apartment with convenient access to amenities.' },
  { _id: 'apt-3', title: 'Apartment 3', price: 350000, location: 'Residential Suburb', image: apt3, bedrooms: 2, bathrooms: 2, area: 900, category: 'Apartment', description: 'Comfortable apartment in a quiet residential neighborhood.' },
  { _id: 'apt-4', title: 'Spacious Apartment 4', price: 380000, location: 'Family-Friendly Area', image: apt4, bedrooms: 3, bathrooms: 2, area: 1000, category: 'Apartment', description: 'Spacious apartment ideal for families.' },
  { _id: 'apt-5', title: 'Apartment 5', price: 400000, location: 'Downtown', image: apt5, bedrooms: 3, bathrooms: 2, area: 1100, category: 'Apartment', description: 'Apartment located near a beautiful park.' },
  { _id: 'apt-6', title: 'Apartment 6', price: 420000, location: 'With Balcony', image: apt6, bedrooms: 4, bathrooms: 2, area: 1200, category: 'Apartment', description: 'Apartment with a large balcony and great views.' },
  { _id: 'apt-7', title: 'Waterfront Apartment', price: 450000, location: 'Waterfront', image: apt7, bedrooms: 4, bathrooms: 3, area: 1300, category: 'Apartment', description: 'Luxury apartment with stunning waterfront views.' },

  // Commercial Properties (7 images)
  { _id: 'comm-1', title: 'Commercial Space 1', price: 1000000, location: 'Business District', image: comm1, bedrooms: 0, bathrooms: 1, area: 1000, category: 'Commercial', description: 'Prime commercial space in the main business district.' },
  { _id: 'comm-2', title: 'Retail Unit 2', price: 1200000, location: 'High Street', image: comm2, bedrooms: 0, bathrooms: 1, area: 1200, category: 'Commercial', description: 'High visibility retail unit on a busy street.' },
  { _id: 'comm-3', title: 'Commercial Building 3', price: 1500000, location: 'Commercial Zone', image: comm3, bedrooms: 0, bathrooms: 2, area: 1500, category: 'Commercial', description: 'Large commercial building for various uses.' },
  { _id: 'comm-4', title: 'Shop Front 4', price: 1800000, location: 'Shopping Center', image: comm4, bedrooms: 0, bathrooms: 2, area: 1800, category: 'Commercial', description: 'Shop front within a popular shopping center.' },
  { _id: 'comm-5', title: 'Commercial Unit 5', price: 2000000, location: 'Downtown Core', image: comm5, bedrooms: 0, bathrooms: 1, area: 2000, category: 'Commercial', description: 'Commercial unit in the bustling downtown core.' },
  { _id: 'comm-6', title: 'Office Space 6', price: 2200000, location: 'Office Park', image: comm6, bedrooms: 0, bathrooms: 2, area: 2200, category: 'Commercial', description: 'Modern office space in a well-established office park.' },
  { _id: 'comm-7', title: 'Warehouse 7', price: 2500000, location: 'Industrial Area', image: comm7, bedrooms: 0, bathrooms: 2, area: 2500, category: 'Commercial', description: 'Large warehouse suitable for storage or light industrial.' },

  // Pharmacies Properties (7 images)
  { _id: 'pharm-1', title: 'Pharmacy Location 1', price: 300000, location: 'Residential Area', image: pharm1, bedrooms: 0, bathrooms: 1, area: 600, category: 'Pharmacies', description: 'Pharmacy location in a densely populated residential area.' },
  { _id: 'pharm-2', title: 'Pharmacy 2', price: 320000, location: 'Near Clinic', image: pharm2, bedrooms: 0, bathrooms: 1, area: 650, category: 'Pharmacies', description: 'Pharmacy conveniently located near a medical clinic.' },
  { _id: 'pharm-3', title: 'Pharmacy Unit 3', price: 350000, location: 'Shopping Plaza', image: pharm3, bedrooms: 0, bathrooms: 1, area: 700, category: 'Pharmacies', description: 'Pharmacy unit within a busy shopping plaza.' },
  { _id: 'pharm-4', title: 'Pharmacy Space 4', price: 380000, location: 'Town Center', image: pharm4, bedrooms: 0, bathrooms: 1, area: 750, category: 'Pharmacies', description: 'Pharmacy space in the heart of the town center.' },
  { _id: 'pharm-5', title: 'Pharmacy 5', price: 400000, location: 'Medical Complex', image: pharm5, bedrooms: 0, bathrooms: 1, area: 800, category: 'Pharmacies', description: 'Pharmacy located within a large medical complex.' },
  { _id: 'pharm-6', title: 'Pharmacy 6', price: 420000, location: 'Shopping Plaza', image: pharm6, bedrooms: 0, bathrooms: 1, area: 850, category: 'Pharmacies', description: 'Pharmacy unit within a busy shopping plaza.' },
  { _id: 'pharm-7', title: 'Pharmacy 7', price: 450000, location: 'Medical Center', image: pharm7, bedrooms: 0, bathrooms: 1, area: 900, category: 'Pharmacies', description: 'Pharmacy in the vicinity of a major hospital.' },

  // Hotel Apartment Properties (6 images)
  { _id: 'hotel-apt-1', title: 'Luxury Hotel Apartment', price: 600000, location: 'Tourist Area', image: hotelApt1, bedrooms: 1, bathrooms: 1, area: 500, category: 'Hotel Apartment', description: 'Fully furnished luxury hotel apartment.' },
  { _id: 'hotel-apt-2', title: 'Premium Hotel Suite', price: 650000, location: 'Downtown', image: hotelApt2, bedrooms: 2, bathrooms: 2, area: 600, category: 'Hotel Apartment', description: 'Spacious hotel suite with premium amenities.' },
  { _id: 'hotel-apt-3', title: 'Executive Hotel Apartment', price: 700000, location: 'Business District', image: hotelApt3, bedrooms: 2, bathrooms: 2, area: 700, category: 'Hotel Apartment', description: 'Executive hotel apartment perfect for business travelers.' },
  { _id: 'hotel-apt-4', title: 'Deluxe Hotel Suite', price: 750000, location: 'Waterfront', image: hotelApt4, bedrooms: 3, bathrooms: 2, area: 800, category: 'Hotel Apartment', description: 'Deluxe hotel suite with stunning waterfront views.' },
  { _id: 'hotel-apt-5', title: 'Penthouse Hotel Apartment', price: 800000, location: 'City Center', image: hotelApt5, bedrooms: 3, bathrooms: 3, area: 900, category: 'Hotel Apartment', description: 'Luxurious penthouse hotel apartment in the heart of the city.' },
  { _id: 'hotel-apt-6', title: 'Grand Hotel Suite', price: 850000, location: 'Luxury Zone', image: hotelApt6, bedrooms: 4, bathrooms: 3, area: 1000, category: 'Hotel Apartment', description: 'Grand hotel suite with premium finishes and amenities.' },

  // Medical Properties (7 images)
  { _id: 'med-1', title: 'Medical Center 1', price: 800000, location: 'Healthcare District', image: medical1, bedrooms: 0, bathrooms: 2, area: 1200, category: 'Medical', description: 'Modern medical center with state-of-the-art facilities.' },
  { _id: 'med-2', title: 'Medical Clinic 2', price: 850000, location: 'Medical Complex', image: medical2, bedrooms: 0, bathrooms: 2, area: 1300, category: 'Medical', description: 'Well-equipped medical clinic in a professional complex.' },
  { _id: 'med-3', title: 'Medical Office 3', price: 900000, location: 'Hospital Area', image: medical3, bedrooms: 0, bathrooms: 3, area: 1400, category: 'Medical', description: 'Medical office space near major hospital.' },
  { _id: 'med-4', title: 'Medical Facility 4', price: 950000, location: 'Healthcare Hub', image: medical4, bedrooms: 0, bathrooms: 3, area: 1500, category: 'Medical', description: 'Comprehensive medical facility with multiple treatment rooms.' },
  { _id: 'med-5', title: 'Medical Center 5', price: 1000000, location: 'Medical District', image: medical5, bedrooms: 0, bathrooms: 4, area: 1600, category: 'Medical', description: 'Large medical center with advanced diagnostic capabilities.' },
  { _id: 'med-6', title: 'Medical Clinic 6', price: 1050000, location: 'Healthcare Zone', image: medical6, bedrooms: 0, bathrooms: 4, area: 1700, category: 'Medical', description: 'Specialized medical clinic with modern amenities.' },
  { _id: 'med-7', title: 'Medical Facility 7', price: 1100000, location: 'Medical Complex', image: medical7, bedrooms: 0, bathrooms: 5, area: 1800, category: 'Medical', description: 'Premium medical facility with comprehensive services.' },

  // You can add sample properties for other categories (Tower, New Cairo, Land, Villa) if you have images for them
  // Example for Hotel Apartment (if you have images like hotel-apartment.jpg)
  // { _id: 'hotel-apt-1', title: 'Luxury Hotel Apartment', price: 600000, location: 'Tourist Area', image: require('../Assets/hotel-apartment.jpg'), bedrooms: 1, bathrooms: 1, area: 500, category: 'Hotel Apartment', description: 'Fully furnished luxury hotel apartment.' },
];

const PropertyList = () => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      // Always use sample data to match the desired UI
      console.log('Using sample data to match the desired UI');
      setProperties(sampleProperties);
      setFilteredProperties(sampleProperties);
      setLoading(false);
    } catch (err) {
      // This catch block might be less relevant now but kept for robustness
      console.log('Error setting sample data:', err); // Log any error just in case
      setError(err.message); // Set error state
      setLoading(false); // Ensure loading is false even if setting sample data fails somehow
    }
  };

  const handleFilterChange = ({ category, priceRange }) => {
    let filtered = [...properties];

    if (category && category !== 'All') {
      filtered = filtered.filter(property => property.category === category);
    }

    if (priceRange.min) {
      filtered = filtered.filter(property => property.price >= Number(priceRange.min));
    }

    if (priceRange.max) {
      filtered = filtered.filter(property => property.price <= Number(priceRange.max));
    }

    setFilteredProperties(filtered);
  };

  const handleSortChange = (sortBy) => {
    const sorted = [...filteredProperties];
    
    switch (sortBy) {
      case 'price_asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'area_asc':
        sorted.sort((a, b) => a.area - b.area);
        break;
      case 'area_desc':
        sorted.sort((a, b) => b.area - a.area);
        break;
      case 'newest':
        // Assuming a 'createdAt' field exists in the property data
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        break;
    }

    setFilteredProperties(sorted);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>Error: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Use properties from state, which will be from API or sample data
  const propertiesToDisplay = filteredProperties.length > 0 ? filteredProperties : properties;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-8">Available Properties</h1>
      
      <PropertyFilter
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
      />
      
      {propertiesToDisplay.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mt-4 sm:mt-8">
          {propertiesToDisplay.map((property) => (
            <PropertyCard key={property._id} property={property} />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-600 dark:text-gray-300 py-8">
          <p className="text-base sm:text-lg">No properties found matching your criteria.</p>
          {properties.length > 0 && (
            <button 
              onClick={() => setFilteredProperties(properties)} 
              className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors text-sm sm:text-base"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PropertyList; 