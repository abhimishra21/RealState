import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
// import { useRouter } from 'next/router';
// import Head from 'next/head';
import { Container, Grid, Typography, Box, Paper } from '@mui/material';
// import { fetchListing } from '../../store/slices/listingSlice';
import { listingAPI } from '../../services/api';
// import Image from 'next/image'; // Removed Next.js Image component

export default function ListingPage({ initialListing }) {
  const dispatch = useDispatch();
  const { id } = useParams(); // Get the id from the URL parameters
  // const { currentListing, loading: reduxLoading } = useSelector((state) => state.listings);

  // Local state for single listing
  const [listing, setListing] = useState(initialListing || null);
  const [loading, setLoading] = useState(!initialListing);
  const [error, setError] = useState(null);

  useEffect(() => {
    // if (!initialListing) { // Condition might not be needed if initialListing is always null after removing getServerSideProps
      const fetchSingleListing = async () => {
        try {
          setLoading(true);
          const response = await listingAPI.getListing(id); // Use listingAPI.getListing
          setListing(response.data);
          setError(null);
        } catch (err) {
          console.error('Error fetching single listing:', err);
          setError(err.message);
          setListing(null);
        } finally {
          setLoading(false);
        }
      };
      fetchSingleListing();
    // }
  }, [id]); // Dependency array includes id

  if (loading) { // Use local loading state
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Typography>Loading listing details...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) { // Use local error state
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h5" color="error">Error loading listing: {error}</Typography>
      </Container>
    );
  }

  if (!listing) { // Check if listing data is available
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h5">Listing not found</Typography>
      </Container>
    );
  }

  return (
    <>
      {/* <Head>
        <title>{listing?.name || 'Property Details'} | TopReal</title>
        <meta name="description" content={listing?.description || 'View detailed information about this property on TopReal.'} />
        <meta property="og:title" content={`${listing?.name || 'Property Details'} | TopReal`} />
        <meta property="og:description" content={listing?.description || 'View detailed information about this property on TopReal.'} />
        <meta property="og:type" content="website" />
        {listing?.imageUrls?.[0] && (
          <meta property="og:image" content={listing.imageUrls[0]} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
      </Head> */}

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                {listing?.name}
              </Typography>
              <Typography variant="h5" color="primary" gutterBottom>
                ${listing?.regularPrice?.toLocaleString()}
              </Typography>
              <Typography variant="body1" paragraph>
                {listing?.description}
              </Typography>
            </Paper>

            {listing?.imageUrls?.length > 0 && (
              <Grid container spacing={2}>
                {listing.imageUrls.map((url, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Box sx={{ position: 'relative', height: 300 }}>
                      <img // Replaced Next.js Image with standard img tag
                        src={url}
                        alt={`Property image ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} // Added styling equivalent to layout="fill" objectFit="cover"
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Property Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Bedrooms
                  </Typography>
                  <Typography variant="body1">{listing?.bedrooms}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Bathrooms
                  </Typography>
                  <Typography variant="body1">{listing?.bathrooms}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Type
                  </Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {listing?.type}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Offer
                  </Typography>
                  <Typography variant="body1">
                    {listing?.offer ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

export async function getServerSideProps(context) {
  // This function is specific to Next.js and is not needed in a react-router-dom application
  // Data fetching should be handled in the component using useEffect or similar hooks.
  // Returning null for props for now.
  return { props: { initialListing: null } };
  // try {
  //   const listing = await getListing(context.params.id);
  //   return {
  //     props: {
  //       initialListing: listing,
  //     },
  //   };
  // } catch (error) {
  //   console.error('Error fetching listing:', error);
  //   return {
  //     props: {
  //       initialListing: null,
  //     },
  //   };
  // }
} 