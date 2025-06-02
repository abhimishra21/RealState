import Listing from '../models/listing.model.js';
import { errorHandler } from '../utils/error.js';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mongoose from 'mongoose';
import { validateListing } from '../utils/validators.js';

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

// Validate AI API keys
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set in environment variables');
}

if (!process.env.GOOGLE_AI_API_KEY) {
  console.error('GOOGLE_AI_API_KEY is not set in environment variables');
}

if (!process.env.UNSPLASH_API_KEY) {
  console.error('UNSPLASH_API_KEY is not set in environment variables');
}

// Get all listings with optional filters
export const getListings = async (req, res, next) => {
  try {
    const {
      type,
      propertyType,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      location,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Build filter object
    const filter = {};
    if (type) filter.type = type;
    if (propertyType) filter.propertyType = propertyType;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (bedrooms) filter.bedrooms = Number(bedrooms);
    if (bathrooms) filter.bathrooms = Number(bathrooms);
    if (location) filter.location = { $regex: location, $options: 'i' };

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get listings with filters and pagination
    const listings = await Listing.find(filter)
      .sort({ [sort]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('userRef', 'username email avatar');

    // Get total count for pagination
    const total = await Listing.countDocuments(filter);

    res.status(200).json({
      listings,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

// Get a single listing by ID
export const getListing = async (req, res, next) => {
  try {
    // Validate if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(errorHandler(400, 'Invalid listing ID format'));
    }

    const listing = await Listing.findById(req.params.id)
      .populate('userRef', 'username email avatar');

    if (!listing) {
      return next(errorHandler(404, 'Listing not found!'));
    }

    // Increment views count
    listing.views = (listing.views || 0) + 1;
    await listing.save();

    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};

// Create a new listing
export const createListing = async (req, res, next) => {
  try {
    const listingData = req.body;

    // Validate listing data
    const validationError = validateListing(listingData);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const listing = new Listing({
      ...listingData,
      userRef: req.user.id
    });

    const savedListing = await listing.save();
    res.status(201).json(savedListing);
  } catch (error) {
    next(error);
  }
};

// Update a listing
export const updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid listing ID format' });
    }

    // Validate update data
    const validationError = validateListing(updateData);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Check if user is the seller
    if (listing.userRef.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this listing' });
    }

    Object.assign(listing, updateData);
    await listing.save();

    res.json(listing);
  } catch (error) {
    console.error('Error in updateListing:', error);
    res.status(500).json({ message: 'Error updating listing' });
  }
};

// Delete a listing
export const deleteListing = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid listing ID format' });
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Check if user is the seller
    if (listing.userRef.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }

    await listing.deleteOne();
    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Error in deleteListing:', error);
    res.status(500).json({ message: 'Error deleting listing' });
  }
};

export const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No images uploaded' 
      });
    }

    // Get the URLs of the uploaded files
    const urls = req.files.map(file => {
      // Ensure the URL is absolute
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? process.env.SERVER_URL || 'http://localhost:3001'
        : 'http://localhost:3001';
      return `${baseUrl}/uploads/${file.filename}`;
    });

    console.log('Successfully uploaded files:', urls);

    res.status(200).json({
      success: true,
      urls
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error uploading images',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// AI-powered image analysis
export const analyzeImage = async (req, res, next) => {
  try {
    const { imageData } = req.body;
    
    // Use Google's Gemini Pro Vision for image analysis
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageData.split(',')[1], 'base64');
    
    const result = await model.generateContent([
      "Analyze this product image and provide: 1) A suggested title, 2) A detailed description, 3) The most appropriate category, and 4) A suggested price based on similar items. Format the response as JSON.",
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBuffer.toString('base64')
        }
      }
    ]);
    
    const response = await result.response;
    const analysis = JSON.parse(response.text());
    
    res.status(200).json({
      suggestedTitle: analysis.title,
      suggestedDescription: analysis.description,
      suggestedCategory: analysis.category,
      suggestedPrice: analysis.price
    });
  } catch (error) {
    next(error);
  }
};

// AI-powered semantic search
export const searchListings = async (req, res, next) => {
  try {
    const { query } = req.query;
    
    // Use OpenAI for semantic search
    const embedding = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: query
    });
    
    const queryEmbedding = embedding.data.data[0].embedding;
    
    // Find listings with similar embeddings
    const listings = await Listing.find({
      $text: { $search: query }
    }).limit(10);
    
    // Sort by relevance using cosine similarity
    const scoredListings = listings.map(listing => ({
      ...listing.toObject(),
      relevance: cosineSimilarity(queryEmbedding, listing.embedding)
    }));
    
    scoredListings.sort((a, b) => b.relevance - a.relevance);
    
    res.status(200).json({
      listings: scoredListings,
      total: scoredListings.length
    });
  } catch (error) {
    next(error);
  }
};

// Predict category based on title and description
export const predictCategory = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    
    if (!title || !description) {
      return next(errorHandler(400, 'Title and description are required'));
    }

    console.log('Predicting category for:', { title, description });
    
    // Use OpenAI to predict the category
    const prompt = `Given the following listing:
      Title: ${title}
      Description: ${description}
      
      Predict the most appropriate category from these options: property, vehicle, electronics, furniture, other.
      Return the response as JSON with a suggestedCategory field.`;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }]
    });
    
    const prediction = JSON.parse(completion.choices[0].message.content);
    console.log('Category prediction result:', prediction);
    
    res.status(200).json(prediction);
  } catch (error) {
    console.error('Error in predictCategory:', error);
    next(error);
  }
};

// Get image recommendations
export const getImageRecommendations = async (req, res, next) => {
  try {
    const { title, description, category, currentImages } = req.body;
    
    if (!title || !description || !category) {
      return next(errorHandler(400, 'Title, description, and category are required'));
    }

    console.log('Getting image recommendations for:', { title, description, category });
    
    // Use OpenAI to generate image recommendations
    const prompt = `Given the following listing:
      Title: ${title}
      Description: ${description}
      Category: ${category}
      
      Suggest 3 types of additional images that would improve the listing's visibility and appeal.
      For each suggestion, provide a description of what the image should show.
      Return the response as JSON with an array of recommendations, each containing a description and a suggested image search query.`;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }]
    });
    
    const recommendations = JSON.parse(completion.choices[0].message.content);
    console.log('Image recommendations result:', recommendations);
    
    // Use Unsplash API to get actual image URLs based on the search queries
    const imageUrls = await Promise.all(
      recommendations.recommendations.map(async (rec) => {
        try {
          const response = await fetch(
            `https://api.unsplash.com/photos/random?query=${encodeURIComponent(rec.searchQuery)}&client_id=${process.env.UNSPLASH_API_KEY}`
          );
          const data = await response.json();
          return {
            url: data.urls.regular,
            description: rec.description
          };
        } catch (error) {
          console.error('Error fetching image from Unsplash:', error);
          return null;
        }
      })
    );
    
    const validImageUrls = imageUrls.filter(url => url !== null);
    console.log('Final image recommendations:', validImageUrls);
    
    res.status(200).json({ recommendations: validImageUrls });
  } catch (error) {
    console.error('Error in getImageRecommendations:', error);
    next(error);
  }
};

// AI-powered price recommendation
export const getPriceRecommendation = async (req, res, next) => {
  try {
    const { title, description, category, condition } = req.body;
    
    if (!title || !description || !category || !condition) {
      return next(errorHandler(400, 'Title, description, category, and condition are required'));
    }

    console.log('Getting price recommendation for:', { title, description, category, condition });
    
    // Find similar listings in the database
    const similarListings = await Listing.find({
      category,
      condition
    }).sort({ createdAt: -1 }).limit(10);
    
    console.log('Found similar listings:', similarListings.length);
    
    // Use OpenAI to analyze similar listings and suggest a price
    const prompt = `Given the following product details:
      Title: ${title}
      Description: ${description}
      Category: ${category}
      Condition: ${condition}
      
      And these similar listings with their prices:
      ${similarListings.map(listing => `
        Title: ${listing.title}
        Price: ${listing.price}
        Condition: ${listing.condition}
      `).join('\n')}
      
      Analyze the market and suggest an appropriate price range.
      Consider the condition, category, and market trends.
      Return the response as JSON with minPrice and maxPrice fields.`;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }]
    });
    
    const recommendation = JSON.parse(completion.choices[0].message.content);
    console.log('Price recommendation result:', recommendation);
    
    res.status(200).json(recommendation);
  } catch (error) {
    console.error('Error in getPriceRecommendation:', error);
    next(error);
  }
};

// Helper function for cosine similarity
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
} 