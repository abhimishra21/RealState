import bcryptjs from "bcryptjs";
import User from "../models/user.model.js";
import { errorHandler } from "../utils/error.js";
import Listing from "../models/listing.model.js";
import jwt from 'jsonwebtoken';
import { redisClient } from '../index.js'; // Import the Redis client

// Function to generate JWT
const generateToken = (id) => {
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '24h' }); // Token expires in 24 hours
  const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' }); // Refresh token expires in 7 days
  return { accessToken, refreshToken };
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

//Get Current Authenticated User
export const getCurrentUserController = async (req, res, next) => {
  try {
    console.log('Attempting to fetch current user...');
    // The user ID is available in req.user from the verifyToken middleware
    const userId = req.user.id;
    console.log('Fetching user with ID:', userId);

    const user = await User.findById(userId);

    if (!user) {
      console.warn('User not found for ID:', userId);
      return next(errorHandler(404, "User not found!"));
    }

    console.log('User found:', user.username);
    // Exclude password and twoFactorSecret from the response
    const { password: pass, twoFactorSecret, ...rest } = user._doc;

    res.status(200).json(rest);
  } catch (error) {
    console.error('Error in getCurrentUserController:', error);
    next(error);
  }
};

//Update User
export const updateUser = async (req, res, next) => {
  if (req.user.id !== req.params.id)
    return next(errorHandler(401, "You can only update your own account!"));
  try {
    // Check if username or email already exists
    if (req.body.username || req.body.email) {
      const existingUser = await User.findOne({
        $or: [
          { username: req.body.username },
          { email: req.body.email }
        ],
        _id: { $ne: req.params.id }
      });
      
      if (existingUser) {
        return next(errorHandler(400, "Username or email already exists!"));
      }
    }

    // Handle avatar upload
    if (req.file) {
      // Create the full URL for the avatar
      const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      req.body.avatar = avatarUrl;
    }

    // Validate password if provided
    if (req.body.password) {
      if (req.body.password.length < 6) {
        return next(errorHandler(400, "Password must be at least 6 characters long!"));
      }
      req.body.password = bcryptjs.hashSync(req.body.password, 10);
      // If password is changed, invalidate refresh token by deleting from Redis
      await deleteRefreshToken(req.user.id);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    const { password, ...rest } = updatedUser._doc;

    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};

//Delete User
export const deleteUser = async (req, res, next) => {
  if (req.user.id !== req.params.id)
    return next(errorHandler(401, "You can only delete your own account!"));
  try {
    await User.findByIdAndDelete(req.params.id);
    // Invalidate refresh token on user deletion
    await deleteRefreshToken(req.user.id);
    res.clearCookie("access_token");
    res.status(200).json("User has been deleted!");
  } catch (error) {
    next(error);
  }
};

//Get User Listing
export const getUserListings = async (req, res, next) => {
  console.log('Attempting to fetch user listings...');
  console.log('Authenticated user ID (req.user.id):', req.user?.id);
  console.log('User ID from parameters (req.params.id):', req.params?.id);

  if (req.user.id.toString() === req.params.id) {
    try {
      console.log('Fetching listings for user ID:', req.user.id);
      const listings = await Listing.find({ userRef: req.params.id });
      console.log('Found', listings.length, 'listings for user ID:', req.user.id);
      res.status(200).json(listings);
    } catch (error) {
      console.error('Error in getUserListings controller:', error);
      next(error);
    }
  } else {
    console.warn('Attempted to fetch listings for another user. Authenticated user ID:', req.user?.id, ', Requested user ID:', req.params?.id);
    return next(errorHandler(401, "You can only view your own listings!"));
  }
};

// Get User
export const getUser = async (req, res) => {
  try {
    console.log('Attempting to fetch user by ID...');
    const userId = req.params.id;
    console.log('Fetching user with ID from params:', userId);

    let user;
    if (userId === 'me') {
      // If the ID is 'me', use the authenticated user's ID
      if (!req.user || !req.user._id) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      user = await User.findById(req.user._id);
    } else {
      // Otherwise, try to find the user by the provided ID
      user = await User.findById(userId);
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found by ID from params:', user.username);
    res.json(user);
  } catch (error) {
    console.error('Error in getUser controller:', error);
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

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
    // No tokens are generated on signup, only on signin
    res.status(201).json('User created successfully!');
  } catch (error) {
    next(error);
  }
};

export const signin = async (req, res, next) => {
  const { email, password } = req.body;

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

    // Generate JWT and refresh token
    const { accessToken, refreshToken } = generateToken(validUser._id);

    // Save refresh token in Redis
    await saveRefreshToken(validUser._id, refreshToken);

    // Exclude password from the response
    const { password: pass, ...rest } = validUser._doc;

    // Set JWT as a cookie
    res
      .cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: 'strict', // Prevent CSRF attacks
      })
      .status(200)
      .json({ user: rest, refreshToken });
  } catch (error) {
    next(error);
  }
};

export const google = async (req, res, next) => {
  const { email, name, googlePhotoUrl } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) {
      // Generate JWT and refresh token for existing user
      const { accessToken, refreshToken } = generateToken(user._id);

      // Save refresh token in Redis
      await saveRefreshToken(user._id, refreshToken);

      const { password: pass, ...rest } = user._doc;
      res
        .cookie('access_token', accessToken, {
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
      const { accessToken, refreshToken } = generateToken(newUser._id);

      // Save refresh token in Redis
      await saveRefreshToken(newUser._id, refreshToken);

      const { password: pass, ...rest } = newUser._doc;
      res
        .cookie('access_token', accessToken, {
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

export const signout = async (req, res, next) => {
  try {
    // Delete refresh token from Redis on signout
    // Assuming user ID is available from the verified JWT in req.user
    if (req.user && req.user.id) {
      await deleteRefreshToken(req.user.id);
    }
    res.clearCookie('access_token').status(200).json('User has been signed out');
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
    const { accessToken, refreshToken } = generateToken(user._id);

    // Update the refresh token in Redis
    await saveRefreshToken(user._id, refreshToken);

    // Exclude password from the response
    const { password: pass, ...rest } = user._doc;

    // Set new JWT as a cookie
    res
      .cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      })
      .status(200)
      .json({ user: rest, refreshToken: refreshToken }); // Return the new refresh token

  } catch (error) {
    // Handle JWT verification errors (e.g., expired refresh token)
    next(errorHandler(403, 'Invalid refresh token'));
  }
};
