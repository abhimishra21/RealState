import express from "express";
import {
  google,
  signOut,
  signin,
  signup,
  generateTwoFactorSecret,
  verifyTwoFactorToken,
  disableTwoFactor,
  refreshToken
} from "../controllers/auth.controller.js";
import { verifyToken } from '../utils/verifyUser.js';
import redisClient from '../utils/redisClient.js';

const router = express.Router();

router.post("/signup", signup); //Sign-Up
router.post("/signin", signin); //Sign-In
router.post("/signout", verifyToken, async (req, res) => {
  try {
    // Clear the refresh token from Redis if available
    const userId = req.user._id;
    try {
      if (redisClient.isOpen) {
        await redisClient.del(`refreshToken:${userId}`);
      }
    } catch (redisError) {
      console.error('Redis error during signout:', redisError);
      // Continue with signout even if Redis fails
    }
    
    // Clear the access token cookie
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return res.status(200).json({
      success: true,
      message: 'Successfully signed out'
    });
  } catch (error) {
    console.error('Signout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error during sign out'
    });
  }
});
router.post("/google", google); //Google
router.post("/refresh", refreshToken);

// 2FA Routes (Protected)
router.post('/generate-2fa-secret', verifyToken, generateTwoFactorSecret); // Generate 2FA secret and QR code
router.post('/verify-2fa-setup', verifyToken, verifyTwoFactorToken);   // Verify token to enable 2FA
router.post('/disable-2fa', verifyToken, disableTwoFactor);         // Disable 2FA

export default router;
