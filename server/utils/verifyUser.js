import jwt from "jsonwebtoken";
import { errorHandler } from "./error.js";
import User from '../models/user.model.js';

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(errorHandler(401, 'No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(errorHandler(404, 'User not found'));
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(errorHandler(401, 'Token has expired'));
      }
      if (error.name === 'JsonWebTokenError') {
        return next(errorHandler(401, 'Invalid token'));
      }
      return next(errorHandler(401, 'Authentication failed'));
    }
  } catch (error) {
    next(error);
  }
};
