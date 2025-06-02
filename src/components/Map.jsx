import { useEffect, useRef, useState } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060
};

const libraries = ['places'];

const Map = ({ 
  listings = [], 
  center = defaultCenter, 
  zoom = 12,
  onMarkerClick,
  selectedListing = null,
  height = '400px'
}) => {
  const [map, setMap] = useState(null);
  const [infoWindowPosition, setInfoWindowPosition] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleMarkerClick = (listing, position) => {
    setSelectedMarker(listing);
    setInfoWindowPosition(position);
    if (onMarkerClick) {
      onMarkerClick(listing);
    }
  };

  const handleInfoWindowClose = () => {
    setSelectedMarker(null);
    setInfoWindowPosition(null);
  };

  const handleMapLoad = (map) => {
    setMap(map);
    setIsLoading(false);
  };

  const handleMapError = (error) => {
    console.error('Error loading map:', error);
    setMapError('Failed to load map. Please try again later.');
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <Paper elevation={3} sx={{ p: 2, height: height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (mapError) {
    return (
      <Paper elevation={3} sx={{ p: 2, height: height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="error">{mapError}</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 2, height: height }}>
      <LoadScript
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
        libraries={libraries}
        onError={handleMapError}
      >
        <GoogleMap
          mapContainerStyle={{ ...containerStyle, height }}
          center={center}
          zoom={zoom}
          onLoad={handleMapLoad}
          options={{
            zoomControl: true,
            streetViewControl: true,
            mapTypeControl: true,
            fullscreenControl: true,
            gestureHandling: 'greedy',
          }}
        >
          {listings.map((listing) => (
            <Marker
              key={listing._id}
              position={{
                lat: listing.location?.coordinates[1] || defaultCenter.lat,
                lng: listing.location?.coordinates[0] || defaultCenter.lng
              }}
              onClick={() => handleMarkerClick(
                listing,
                {
                  lat: listing.location?.coordinates[1] || defaultCenter.lat,
                  lng: listing.location?.coordinates[0] || defaultCenter.lng
                }
              )}
            />
          ))}

          {selectedMarker && infoWindowPosition && (
            <InfoWindow
              position={infoWindowPosition}
              onCloseClick={handleInfoWindowClose}
            >
              <Box sx={{ p: 1, maxWidth: 200 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {selectedMarker.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ${selectedMarker.price?.toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  {selectedMarker.address}
                </Typography>
              </Box>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
    </Paper>
  );
};

export default Map; 