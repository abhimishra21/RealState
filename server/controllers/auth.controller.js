import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import { errorHandler } from "../utils/error.js";
import jwt from "jsonwebtoken";
import { redisClient } from "../index.js";
import speakeasy from "speakeasy";
import qrcode from "qrcode";

// Function to generate JWT
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" }); // Token expires in 1 hour
};

// Function to generate Refresh Token
const generateRefreshToken = (id) => {
  if (!process.env.REFRESH_TOKEN_SECRET) {
    throw new Error('REFRESH_TOKEN_SECRET is not defined');
  }
  return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" }); // Refresh token expires in 7 days
};

// Helper function to save refresh token in Redis
const saveRefreshToken = async (userId, token) => {
  // Store token with user ID as key, set expiry to 7 days (in seconds)
  await redisClient.set(`refreshToken:${userId}`, token, { EX: 60 * 60 * 24 * 7 });
};

// Helper function to get refresh token from Redis
const getRefreshToken = async (userId) => {
  return await redisClient.get(`refreshToken:${userId}`);
};

// Helper function to delete refresh token from Redis
const deleteRefreshToken = async (userId) => {
  await redisClient.del(`refreshToken:${userId}`);
};

//Sign-Up
export const signup = async (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password || username === '' || email === '' || password === '') {
    return next(errorHandler(400, 'All fields are required'));
  }

  const hashedPassword = bcryptjs.hashSync(password, 10);

  const newUser = new User({
    username,
    email,
    password: hashedPassword,
  });

  try {
    // Check if username or email already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return next(errorHandler(400, 'Username or email already exists'));
    }

    await newUser.save();
    res.status(201).json('User created successfully!');
  } catch (error) {
    next(error);
  }
};

//Sign-In
export const signin = async (req, res, next) => {
  const { email, password, twoFactorToken } = req.body;

  if (!email || !password || email === '' || password === '') {
    return next(errorHandler(400, 'All fields are required'));
  }

  try {
    const validUser = await User.findOne({ email });
    if (!validUser) {
      return next(errorHandler(404, 'User not found!'));
    }

    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) {
      return next(errorHandler(400, 'Invalid credentials!'));
    }

    // 2FA Check
    if (validUser.twoFactorEnabled) {
      if (!twoFactorToken) {
        // If 2FA is enabled but no token is provided, request it
        return res.status(200).json({ requiresTwoFactor: true });
      }

      // Verify the provided 2FA token
      const tokenValid = speakeasy.totp.verify({
        secret: validUser.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorToken,
      });

      if (!tokenValid) {
        return next(errorHandler(400, 'Invalid 2FA token'));
      }
    }

    // Generate JWT and refresh token
    const token = generateToken(validUser._id);
    const refreshToken = generateRefreshToken(validUser._id);

    // Save refresh token in Redis
    await saveRefreshToken(validUser._id, refreshToken);

    // Exclude password from the response
    const { password: pass, ...rest } = validUser._doc;

    // Set JWT as a cookie with proper settings for cross-origin
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 3600000 // 1 hour in milliseconds
    };

    // Log cookie settings for debugging
    console.log('Setting cookie with options:', cookieOptions);

    res
      .cookie('access_token', token, cookieOptions)
      .status(200)
      .json({ 
        user: rest, 
        refreshToken,
        accessToken: token, // Also return the access token
        requiresTwoFactor: false 
      });
  } catch (error) {
    console.error('Signin error:', error);
    next(error);
  }
};

//Google Sign-In
export const google = async (req, res, next) => {
  const { email, name, googlePhotoUrl } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) {
      // Generate JWT and refresh token for existing user
      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Save refresh token in Redis
      await saveRefreshToken(user._id, refreshToken);

      const { password: pass, ...rest } = user._doc;
      res
        .cookie('access_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        })
        .status(200)
        .json({ user: rest, refreshToken });
    } else {
      // Generate a random password for new google users
      const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);
      const newUser = new User({
        username: name.toLowerCase().split(' ').join('') + Math.random().toString(9).slice(-4),
        email,
        password: hashedPassword,
        avatar: googlePhotoUrl,
      });
      await newUser.save();

      // Generate JWT and refresh token for new user
      const token = generateToken(newUser._id);
      const refreshToken = generateRefreshToken(newUser._id);

      // Save refresh token in Redis
      await saveRefreshToken(newUser._id, refreshToken);

      const { password: pass, ...rest } = newUser._doc;
      res
        .cookie('access_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        })
        .status(200)
        .json({ user: rest, refreshToken });
    }
  } catch (error) {
    next(error);
  }
};

//Sign-Out
export const signOut = async (req, res, next) => {
  try {
    // Delete refresh token from Redis on signout
    // Assuming user ID is available from the verified JWT in req.user
    if (req.user && req.user.id) {
      await deleteRefreshToken(req.user.id);
    }
    res.clearCookie('access_token').status(200).json('User has been logged out!');
  } catch (error) {
    next(error);
  }
};

// Refresh Token endpoint
export const refreshToken = async (req, res, next) => {
  const { refreshToken: clientRefreshToken } = req.body;

  if (!clientRefreshToken) {
    return next(errorHandler(401, 'Refresh token is required'));
  }

  try {
    const decoded = jwt.verify(clientRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const userId = decoded.id;

    // Check if the refresh token exists in Redis for the user
    const storedRefreshToken = await getRefreshToken(userId);

    if (!storedRefreshToken || storedRefreshToken !== clientRefreshToken) {
      // If token is not found or doesn't match, it's invalid or has been revoked
      return next(errorHandler(403, 'Invalid or revoked refresh token'));
    }

    const user = await User.findById(userId);

    if (!user) {
      // This case should ideally not happen if the token is valid and linked to a user ID
      // but it's a safeguard.
      await deleteRefreshToken(userId); // Clean up potentially stale token in Redis
      return next(errorHandler(404, 'User not found'));
    }

    // Generate new JWT and refresh token
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Update the refresh token in Redis
    await saveRefreshToken(user._id, newRefreshToken);

    // Exclude password from the response
    const { password: pass, ...rest } = user._doc;

    // Set new JWT as a cookie
    res
      .cookie('access_token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 3600000 // 1 hour in milliseconds
      })
      .status(200)
      .json({ user: rest, refreshToken: newRefreshToken }); // Return the new refresh token

  } catch (error) {
    // Handle JWT verification errors (e.g., expired refresh token)
    if (error.name === 'TokenExpiredError') {
      return next(errorHandler(401, 'Refresh token expired'));
    }
    return next(errorHandler(403, 'Invalid refresh token'));
  }
};

// 2FA: Generate Secret and QR code
export const generateTwoFactorSecret = async (req, res, next) => {
  const userId = req.user.id; // Get user ID from verified token

  try {
    const user = await User.findById(userId);

    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }

    // Generate a new secret
    const secret = speakeasy.generateSecret({
      length: 20,
      name: process.env.APP_NAME || 'TopReal', // Use app name from env or default
      account: user.email, // Use user's email as account name
    });

    // Save the secret to the user (temporarily until verified)
    user.twoFactorSecret = secret.base32;
    await user.save();

    // Generate QR code URL
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.status(200).json({ secret: secret.base32, qrCodeUrl });
  } catch (error) {
    next(errorHandler(500, 'Error generating 2FA secret'));
  }
};

// 2FA: Verify Token and Enable 2FA
export const verifyTwoFactorToken = async (req, res, next) => {
  const userId = req.user.id; // Get user ID from verified token
  const { token } = req.body;

  if (!token) {
    return next(errorHandler(400, '2FA token is required'));
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }

    if (!user.twoFactorSecret) {
      return next(errorHandler(400, '2FA setup not initiated'));
    }

    // Verify the provided token
    const tokenValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
    });

    if (tokenValid) {
      // Mark 2FA as enabled and save
      user.twoFactorEnabled = true;
      await user.save();
      res.status(200).json({ message: '2FA enabled successfully' });
    } else {
      // If token is invalid, do NOT enable 2FA and potentially clear the secret
      // to force the user to regenerate a new one for security.
      user.twoFactorSecret = null; // Clear the temporary secret
      await user.save();
      return next(errorHandler(400, 'Invalid 2FA token'));
    }
  } catch (error) {
    next(errorHandler(500, 'Error verifying 2FA token'));
  }
};

// 2FA: Disable 2FA
export const disableTwoFactor = async (req, res, next) => {
  const userId = req.user.id; // Get user ID from verified token
  const { password } = req.body; // Require password to disable 2FA

  if (!password) {
    return next(errorHandler(400, 'Password is required to disable 2FA'));
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }

    // Verify user's password before disabling 2FA
    const validPassword = bcryptjs.compareSync(password, user.password);
    if (!validPassword) {
      return next(errorHandler(401, 'Incorrect password'));
    }

    // Disable 2FA and clear the secret
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    await user.save();

    res.status(200).json({ message: '2FA disabled successfully' });
  } catch (error) {
    next(errorHandler(500, 'Error disabling 2FA'));
  }
};
