import Listing from "../models/listing.model.js";
import { errorHandler } from "../utils/error.js";
import Notification from "../models/notification.model.js";

//Create Listing
export const createListing = async (req, res, next) => {
  try {
    const listing = await Listing.create(req.body);

    // Create notification for the listing owner
    const notification = {
      userId: listing.userRef,
      listingId: listing._id,
      type: 'AVAILABILITY',
      message: `Your listing "${listing.name}" has been created successfully`,
      data: {
        listingId: listing._id,
        listingName: listing.name,
        price: listing.regularPrice,
        address: listing.address
      }
    };

    // Create notification in database
    await Notification.create(notification);

    // Send real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${listing.userRef}`).emit('notification', notification);
    }

    return res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
};

//Delete Listing
export const deleteListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    return next(errorHandler(404, "Listing not found!"));
  }

  if (req.user.id !== listing.userRef) {
    return next(errorHandler(401, "You can only delete your own listings!"));
  }

  try {
    // Create notification for listing deletion
    const notification = {
      userId: listing.userRef,
      listingId: listing._id,
      type: 'AVAILABILITY',
      message: `Your listing "${listing.name}" has been deleted`,
      data: {
        listingId: listing._id,
        listingName: listing.name,
        address: listing.address
      }
    };

    // Create notification in database
    await Notification.create(notification);

    // Send real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${listing.userRef}`).emit('notification', notification);
    }

    await Listing.findByIdAndDelete(req.params.id);
    res.status(200).json("Listing has been deleted!");
  } catch (error) {
    next(error);
  }
};

//Update Listing
export const updateListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    return next(errorHandler(404, "Listing not found!"));
  }
  
  if (req.user.id !== listing.userRef) {
    return next(errorHandler(401, "You can only update your own listings!"));
  }

  try {
    const notifications = [];

    // Check for price drop
    if (req.body.regularPrice && req.body.regularPrice < listing.regularPrice) {
      const priceDrop = listing.regularPrice - req.body.regularPrice;
      const notification = {
        userId: listing.userRef,
        listingId: listing._id,
        type: 'PRICE_DROP',
        message: `Price dropped by $${priceDrop.toLocaleString()} for ${listing.name}`,
        data: {
          oldPrice: listing.regularPrice,
          newPrice: req.body.regularPrice,
          priceDrop,
          listingId: listing._id,
          listingName: listing.name
        }
      };
      notifications.push(notification);
    }

    // Check for availability change
    if (req.body.available !== undefined && req.body.available !== listing.available) {
      const notification = {
        userId: listing.userRef,
        listingId: listing._id,
        type: 'AVAILABILITY',
        message: `${listing.name} is now ${req.body.available ? 'available' : 'unavailable'}`,
        data: {
          available: req.body.available,
          listingId: listing._id,
          listingName: listing.name,
          address: listing.address
        }
      };
      notifications.push(notification);
    }

    // Create notifications in database
    if (notifications.length > 0) {
      const createdNotifications = await Notification.insertMany(notifications);
      
      // Send real-time notifications
      const io = req.app.get('io');
      if (io) {
        createdNotifications.forEach(notification => {
          io.to(`user-${listing.userRef}`).emit('notification', notification);
        });
      }
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedListing);
  } catch (error) {
    next(error);
  }
};

//Get Listing
export const getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return next(errorHandler(404, "Listing not found!"));
    }
    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};

//Search Functionality
export const getListings = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 9;
    const startIndex = parseInt(req.query.startIndex) || 0;
    let offer = req.query.offer;

    if (offer === undefined || offer === "false") {
      offer = { $in: [false, true] };
    }

    let furnished = req.query.furnished;

    if (furnished === undefined || furnished === "false") {
      furnished = { $in: [false, true] };
    }

    let parking = req.query.parking;

    if (parking === undefined || parking === "false") {
      parking = { $in: [false, true] };
    }

    let type = req.query.type;

    if (type === undefined || type === "all") {
      type = { $in: ["sale", "rent"] };
    }

    const searchTerm = req.query.searchTerm || "";

    const sort = req.query.sort || "createdAt";

    const order = req.query.order || "desc";

    const listings = await Listing.find({
      name: { $regex: searchTerm, $options: "i" },
      offer,
      furnished,
      parking,
      type,
    })
      .sort({ [sort]: order })
      .limit(limit)
      .skip(startIndex);

    return res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};

export const getPropertyValuation = async (req, res, next) => {
  try {
    const {
      bedrooms,
      bathrooms,
      squareFootage,
      yearBuilt,
      condition,
      maintenanceLevel,
      renovationStatus,
    } = req.body;

    // Validate required fields
    if (!bedrooms || !bathrooms || !squareFootage || !yearBuilt) {
      return next(errorHandler(400, 'All fields are required'));
    }

    // Simple valuation algorithm (you can replace this with a more sophisticated one)
    const baseValue = squareFootage * 200; // Base value per square foot
    const bedroomValue = bedrooms * 50000; // Value per bedroom
    const bathroomValue = bathrooms * 25000; // Value per bathroom
    const ageFactor = Math.max(0, 1 - (2024 - yearBuilt) * 0.01); // Age depreciation

    // Condition multipliers
    const conditionMultipliers = {
      excellent: 1.2,
      good: 1.1,
      fair: 1.0,
      poor: 0.8,
    };

    // Maintenance multipliers
    const maintenanceMultipliers = {
      excellent: 1.15,
      good: 1.05,
      fair: 1.0,
      poor: 0.85,
    };

    // Renovation multipliers
    const renovationMultipliers = {
      luxury: 1.3,
      standard: 1.1,
      basic: 1.0,
    };

    // Calculate final value
    let estimatedValue = baseValue + bedroomValue + bathroomValue;
    estimatedValue *= ageFactor;
    estimatedValue *= conditionMultipliers[condition] || 1;
    estimatedValue *= maintenanceMultipliers[maintenanceLevel] || 1;
    estimatedValue *= renovationMultipliers[renovationStatus] || 1;

    // Calculate confidence score based on data completeness
    const confidenceScore = 85; // Base confidence score

    res.status(200).json({
      success: true,
      estimatedValue: Math.round(estimatedValue),
      confidence: confidenceScore,
      details: {
        baseValue,
        bedroomValue,
        bathroomValue,
        ageFactor,
        conditionMultiplier: conditionMultipliers[condition],
        maintenanceMultiplier: maintenanceMultipliers[maintenanceLevel],
        renovationMultiplier: renovationMultipliers[renovationStatus],
      },
    });
  } catch (error) {
    next(error);
  }
};

// Upload Images
export const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(errorHandler(400, 'No images uploaded'));
    }

    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    res.status(200).json({ urls: imageUrls });
  } catch (error) {
    next(error);
  }
};

// Create offer
export const createOffer = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return next(errorHandler(404, "Listing not found!"));
    }

    // Don't allow offers on your own listings
    if (req.user.id === listing.userRef) {
      return next(errorHandler(400, "You cannot make an offer on your own listing!"));
    }

    const notification = {
      userId: listing.userRef,
      listingId: listing._id,
      type: 'OFFER',
      message: `New offer received for ${listing.name}`,
      data: {
        offerAmount: req.body.offerAmount,
        offerMessage: req.body.message,
        fromUser: req.user.id,
        listingId: listing._id,
        listingName: listing.name,
        address: listing.address
      }
    };

    // Create notification in database
    const createdNotification = await Notification.create(notification);

    // Send real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${listing.userRef}`).emit('notification', notification);
    }

    res.status(200).json({ 
      message: 'Offer sent successfully',
      notification: createdNotification
    });
  } catch (error) {
    next(error);
  }
};
