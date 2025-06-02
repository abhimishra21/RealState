import { Card, CardContent, CardMedia, Typography, Box } from '@mui/material';

const ListingCard = ({ listing, onClick, selected }) => {
  return (
    <Card 
      sx={{ 
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        },
        border: selected ? '2px solid #1976d2' : 'none',
      }}
      onClick={onClick}
    >
      <CardMedia
        component="img"
        height="140"
        image={listing.images?.[0] || '/placeholder.jpg'}
        alt={listing.title}
      />
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          {listing.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          ${listing.price?.toLocaleString()}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {listing.bedrooms} beds
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {listing.bathrooms} baths
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {listing.squareFeet} sqft
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {listing.address}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ListingCard; 