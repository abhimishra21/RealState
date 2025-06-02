import express from 'express';
import {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteMultipleNotifications,
  deleteAllNotifications
} from '../controllers/notification.controller.js';
import { verifyToken } from '../utils/verifyUser.js';
import Notification from '../models/notification.model.js';

const router = express.Router();

// Test notification endpoint
router.post('/test', verifyToken, async (req, res, next) => {
  try {
    const { type, message, data } = req.body;
    
    // Create notification object
    const notification = {
      userId: req.user.id,
      type: type || 'PRICE_DROP',
      message: message || 'Test notification',
      data: data || {}
    };

    // Create notification in database
    const createdNotification = await Notification.create(notification);

    // Send real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${req.user.id}`).emit('notification', createdNotification);
    }

    res.status(200).json(createdNotification);
  } catch (error) {
    console.error('Error creating test notification:', error);
    next(error);
  }
});

// Regular notification routes
router.post('/', verifyToken, createNotification);
router.get('/:userId', verifyToken, getUserNotifications);
router.put('/:id/read', verifyToken, markAsRead);
router.put('/read-all', verifyToken, markAllAsRead);
router.delete('/:id', verifyToken, deleteNotification);
router.delete('/multiple', verifyToken, deleteMultipleNotifications);
router.delete('/all', verifyToken, deleteAllNotifications);

export default router; 