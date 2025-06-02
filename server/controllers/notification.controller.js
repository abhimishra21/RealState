import Notification from '../models/notification.model.js';
import NotificationPreference from '../models/notificationPreference.model.js';
import { errorHandler } from '../utils/error.js';
import mongoose from 'mongoose';

// Create notification
export const createNotification = async (req, res, next) => {
  try {
    const { userId, type, message, data } = req.body;

    // Get user's notification preferences
    const preferences = await NotificationPreference.findOne({ userId });
    
    // Check if user has enabled this type of notification
    if (preferences) {
      const notificationType = type.toLowerCase();
      if (!preferences.preferences[notificationType]) {
        return res.status(200).json({ 
          message: 'Notification not created due to user preferences',
          notificationType,
          enabled: false
        });
      }
    }

    const notification = await Notification.create(req.body);
    return res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    next(error);
  }
};

// Get user notifications
export const getUserNotifications = async (req, res, next) => {
  try {
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return next(errorHandler(400, 'Invalid user ID'));
    }

    const notifications = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    
    return res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    next(error);
  }
};

// Mark notification as read
export const markAsRead = async (req, res, next) => {
  try {
    // Validate notification ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(errorHandler(400, 'Invalid notification ID'));
    }

    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return next(errorHandler(404, 'Notification not found'));
    }

    if (notification.userId.toString() !== req.user.id) {
      return next(errorHandler(401, 'You can only mark your own notifications as read'));
    }

    notification.read = true;
    await notification.save();

    return res.status(200).json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    next(error);
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json({ 
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    next(error);
  }
};

// Delete notification
export const deleteNotification = async (req, res, next) => {
  try {
    // Validate notification ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(errorHandler(400, 'Invalid notification ID'));
    }

    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(200).json({ 
        message: 'Notification already deleted or not found',
        notificationId: req.params.id
      });
    }

    if (notification.userId.toString() !== req.user.id) {
      return next(errorHandler(401, 'You can only delete your own notifications'));
    }

    await Notification.findByIdAndDelete(req.params.id);
    return res.status(200).json({ 
      message: 'Notification has been deleted',
      notificationId: req.params.id
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    next(error);
  }
};

// Delete multiple notifications
export const deleteMultipleNotifications = async (req, res, next) => {
  try {
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds)) {
      return next(errorHandler(400, 'Invalid notification IDs format'));
    }

    // Validate all IDs
    const validIds = notificationIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return next(errorHandler(400, 'No valid notification IDs provided'));
    }

    // Find notifications that belong to the user
    const notifications = await Notification.find({
      _id: { $in: validIds },
      userId: req.user.id
    });

    if (notifications.length === 0) {
      return res.status(200).json({
        message: 'No notifications found to delete',
        deletedCount: 0
      });
    }

    // Delete the notifications
    const result = await Notification.deleteMany({
      _id: { $in: notifications.map(n => n._id) }
    });

    return res.status(200).json({
      message: 'Notifications deleted successfully',
      deletedCount: result.deletedCount,
      notificationIds: notifications.map(n => n._id)
    });
  } catch (error) {
    console.error('Error deleting multiple notifications:', error);
    next(error);
  }
};

// Delete all user notifications
export const deleteAllNotifications = async (req, res, next) => {
  try {
    const result = await Notification.deleteMany({ userId: req.user.id });

    return res.status(200).json({
      message: 'All notifications deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    next(error);
  }
}; 