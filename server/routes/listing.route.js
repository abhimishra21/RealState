import express from "express";
import {
  createListing,
  deleteListing,
  updateListing,
  getListing,
  getListings,
  getPropertyValuation,
  uploadImages,
  createOffer
} from "../controllers/listing.controller.js";
import { verifyToken } from "../utils/verifyUser.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPG, JPEG, PNG & GIF files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size must be less than 5MB' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

router.post("/create", verifyToken, createListing); //Create Listings
router.post("/upload-images", verifyToken, upload.array('images', 5), handleMulterError, uploadImages);
router.delete("/delete/:id", verifyToken, deleteListing); //Delete Listings
router.post("/update/:id", verifyToken, updateListing); //Update Listings
router.get("/get/:id", getListing); //Get Single Listing
router.get("/get", getListings); //Get Listings
router.post("/valuation", getPropertyValuation); //Get Property Valuation - Public endpoint
router.post("/offer/:id", verifyToken, createOffer);

export default router;
