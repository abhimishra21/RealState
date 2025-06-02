import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { getUser, updateUser } from '../controllers/user.controller.js';

const router = express.Router();

// Apply authentication middleware to all user routes
router.use(verifyToken);

// Get user by ID or 'me'
router.get('/:id', getUser);

// Update user
router.post('/update/:id', updateUser);

export default router; 