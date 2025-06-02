import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { 
  getListings, 
  getListing, 
  createListing, 
  updateListing, 
  deleteListing,
  analyzeImage,
  searchListings,
  getPriceRecommendation,
  predictCategory,
  getImageRecommendations
} from '../controllers/marketplace.controller.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Public routes
router.get('/get', getListings);
router.get('/get/:id', getListing);
router.get('/search', searchListings);

// Protected routes
router.post('/create', verifyToken, createListing);
router.post('/update/:id', verifyToken, updateListing);
router.delete('/delete/:id', verifyToken, deleteListing);

// AI-powered routes
router.post('/analyze-image', verifyToken, analyzeImage);
router.post('/predict-category', verifyToken, predictCategory);
router.post('/image-recommendations', verifyToken, getImageRecommendations);
router.post('/price-recommendation', verifyToken, getPriceRecommendation);

export default router; 