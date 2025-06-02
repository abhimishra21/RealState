import express from 'express';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  resetNotificationPreferences
} from '../controllers/notificationPreference.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.get('/', verifyToken, getNotificationPreferences);
router.put('/', verifyToken, updateNotificationPreferences);
router.post('/reset', verifyToken, resetNotificationPreferences);

export default router; 