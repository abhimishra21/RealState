import NotificationPreference from '../models/notificationPreference.model.js';
import { errorHandler } from '../utils/error.js';
import mongoose from 'mongoose';

// Get user's notification preferences
export const getNotificationPreferences = async (req, res, next) => {
  try {
    let preferences = await NotificationPreference.findOne({ userId: req.user.id });
    
    // If no preferences exist, create default preferences
    if (!preferences) {
      preferences = await NotificationPreference.create({
        userId: req.user.id,
        preferences: {
          priceDrop: true,
          availability: true,
          offers: true,
          listingUpdates: true,
          emailNotifications: true,
          pushNotifications: true
        }
      });
    }

    return res.status(200).json(preferences);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    next(error);
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (req, res, next) => {
  try {
    const { preferences } = req.body;

    // Validate preferences object
    if (!preferences || typeof preferences !== 'object') {
      return next(errorHandler(400, 'Invalid preferences format'));
    }

    // Update or create preferences
    const updatedPreferences = await NotificationPreference.findOneAndUpdate(
      { userId: req.user.id },
      { 
        $set: { 
          preferences: {
            ...preferences,
            // Ensure all preference fields are boolean
            priceDrop: Boolean(preferences.priceDrop),
            availability: Boolean(preferences.availability),
            offers: Boolean(preferences.offers),
            listingUpdates: Boolean(preferences.listingUpdates),
            emailNotifications: Boolean(preferences.emailNotifications),
            pushNotifications: Boolean(preferences.pushNotifications)
          }
        } 
      },
      { 
        new: true,
        upsert: true // Create if doesn't exist
      }
    );

    return res.status(200).json(updatedPreferences);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    next(error);
  }
};

// Reset notification preferences to default
export const resetNotificationPreferences = async (req, res, next) => {
  try {
    const defaultPreferences = {
      priceDrop: true,
      availability: true,
      offers: true,
      listingUpdates: true,
      emailNotifications: true,
      pushNotifications: true
    };

    const resetPreferences = await NotificationPreference.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { preferences: defaultPreferences } },
      { new: true, upsert: true }
    );

    return res.status(200).json(resetPreferences);
  } catch (error) {
    console.error('Error resetting notification preferences:', error);
    next(error);
  }
}; 