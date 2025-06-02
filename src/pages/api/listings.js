export default function handler(req, res) {
  // Mock data for testing
  const listings = [
    {
      _id: '1',
      title: 'Modern Apartment',
      price: 250000,
      address: '123 Main St',
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: 1200,
      location: {
        coordinates: [-74.0060, 40.7128]
      }
    },
    {
      _id: '2',
      title: 'Luxury Condo',
      price: 500000,
      address: '456 Park Ave',
      bedrooms: 3,
      bathrooms: 2.5,
      squareFeet: 2000,
      location: {
        coordinates: [-73.9857, 40.7484]
      }
    }
  ];

  res.status(200).json(listings);
} 