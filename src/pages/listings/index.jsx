import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
// import { useRouter } from 'next/router';
// import Head from 'next/head';
import { Container, Grid, Typography, Box, Paper, Alert } from '@mui/material';
import { fetchListings } from '../../store/slices/listingSlice';
import ListingCard from '../../components/ListingCard';
import Map from '../../components/Map';

const ListingsPage = ({ initialListings }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { listings, loading, error } = useSelector((state) => state.listings);
  const [selectedListing, setSelectedListing] = useState(null);
  const [mapCenter, setMapCenter] = useState({
    lat: 40.7128,
    lng: -74.0060
  });

  useEffect(() => {
    if (!initialListings) {
      dispatch(fetchListings());
    }
  }, [dispatch, initialListings]);

  useEffect(() => {
    // Update map center based on listings
    if (listings?.length > 0) {
      const validListings = listings.filter(
        listing => listing.location?.coordinates?.length === 2
      );
      
      if (validListings.length > 0) {
        const center = validListings.reduce(
          (acc, listing) => ({
            lat: acc.lat + listing.location.coordinates[1],
            lng: acc.lng + listing.location.coordinates[0]
          }),
          { lat: 0, lng: 0 }
        );
        
        setMapCenter({
          lat: center.lat / validListings.length,
          lng: center.lng / validListings.length
        });
      }
    }
  }, [listings]);

  const handleMarkerClick = (listing) => {
    setSelectedListing(listing);
  };

  const handleListingClick = (listing) => {
    navigate(`/listings/${listing._id}`);
  };

  const displayListings = initialListings || listings || [];

  if (loading) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <>
      {/* <Head>
        <title>Property Listings | TopReal</title>
        <meta name="description" content="Browse available properties for sale and rent" />
        <meta name="keywords" content="real estate, property listings, homes for sale, apartments for rent" />
      </Head> */}

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Map Section */}
          <Grid item xs={12} md={8}>
            <Map
              listings={displayListings}
              selectedListing={selectedListing}
              onMarkerClick={handleMarkerClick}
              height="600px"
              center={mapCenter}
            />
          </Grid>

          {/* Listings Section */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '600px', overflow: 'auto' }}>
              <Typography variant="h5" gutterBottom>
                Available Properties
              </Typography>
              {displayListings.length === 0 ? (
                <Typography color="text.secondary">
                  No properties found
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {displayListings.map((listing) => (
                    <Grid item xs={12} key={listing._id}>
                      <ListingCard
                        listing={listing}
                        onClick={() => handleListingClick(listing)}
                        selected={selectedListing?._id === listing._id}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export async function getServerSideProps() {
  try {
    const response = await fetch(`${process.env.SERVER_URL}/api/listings`);
    if (!response.ok) {
      throw new Error('Failed to fetch listings');
    }
    const listings = await response.json();
    return { props: { initialListings: listings } };
  } catch (error) {
    console.error('Error fetching listings:', error);
    return { props: { initialListings: [] } };
  }
}

export default ListingsPage; 