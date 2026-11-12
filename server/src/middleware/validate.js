import mongoose from 'mongoose';
import { ApiError } from './errorHandler.js';

// Rejects requests whose body is missing any of the listed fields
export const requireFields =
  (...fields) =>
  (req, _res, next) => {
    const body = req.body || {};
    const missing = fields.filter((f) => body[f] === undefined || body[f] === null || String(body[f]).trim() === '');
    if (missing.length) {
      const errors = Object.fromEntries(missing.map((f) => [f, `${f} is required`]));
      return next(new ApiError(400, `Missing required field(s): ${missing.join(', ')}`, errors));
    }
    next();
  };

// Rejects malformed MongoDB ids before they reach the database
export const validateObjectId =
  (param = 'id') =>
  (req, _res, next) => {
    if (!mongoose.isValidObjectId(req.params[param])) return next(new ApiError(400, `Invalid ${param}`));
    next();
  };
