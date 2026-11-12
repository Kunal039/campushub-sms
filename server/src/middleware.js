import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User } from './models.js';

// ---------- Errors ----------
export class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// Global 4-parameter error handler: every error leaves the API in the same JSON shape
//   { success: false, message: string, errors?: { field: message } }
export function errorHandler(err, _req, res, _next) {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong';
  let errors = err.errors;

  if (err.name === 'ValidationError') {
    // Mongoose schema validation
    status = 400;
    message = 'Validation failed';
    errors = Object.fromEntries(Object.entries(err.errors).map(([field, e]) => [field, e.message]));
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}`;
    errors = { [err.path]: `Invalid value for ${err.path}` };
  } else if (err.code === 11000) {
    // MongoDB duplicate key (unique index)
    status = 409;
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
    const label = { rollNo: 'roll number', code: 'course code' }[field] || field;
    message = `A record with this ${label} already exists`;
    errors = { [field]: `This ${label} is already in use` };
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON';
    errors = undefined;
  }

  if (status >= 500) {
    console.error(err);
    message = 'Internal server error';
    errors = undefined;
  }
  res.status(status).json({ success: false, message, ...(errors && { errors }) });
}

// ---------- Request logger ----------
// Custom logger middleware: method, URL, status, duration and timestamp
export function logger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`
    );
  });
  next();
}

// ---------- Validation ----------
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

// ---------- Authentication ----------
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
