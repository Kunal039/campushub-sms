import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError } from './errorHandler.js';

export const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

// Protects private routes: expects "Authorization: Bearer <token>"
export async function verifyToken(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Authentication required. Please log in.');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    // Token expiry gets its own message so the client can explain what happened
    throw new ApiError(401, err.name === 'TokenExpiredError' ? 'Session expired. Please log in again.' : 'Invalid token.');
  }

  const user = await User.findById(payload.id);
  if (!user) throw new ApiError(401, 'User no longer exists.');
  req.user = user;
  next();
}

// Role-based access control, used after verifyToken
export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user.role)) return next(new ApiError(403, 'Only an admin can do this.'));
    next();
  };
