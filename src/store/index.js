import { configureStore } from '@reduxjs/toolkit';
import listingReducer from './slices/listingSlice';

const store = configureStore({
  reducer: {
    listings: listingReducer,
  },
});

export default store; 