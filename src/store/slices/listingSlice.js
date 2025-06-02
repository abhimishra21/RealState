import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchListings = createAsyncThunk(
  'listings/fetchListings',
  async () => {
    const response = await fetch('/api/listings');
    if (!response.ok) {
      throw new Error('Failed to fetch listings');
    }
    return response.json();
  }
);

const listingSlice = createSlice({
  name: 'listings',
  initialState: {
    listings: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchListings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchListings.fulfilled, (state, action) => {
        state.loading = false;
        state.listings = action.payload;
      })
      .addCase(fetchListings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default listingSlice.reducer; 