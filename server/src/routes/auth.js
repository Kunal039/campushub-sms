import { Router } from 'express';
import User from '../models/User.js';
import { signToken, verifyToken } from '../middleware/auth.js';
import { requireFields } from '../middleware/validate.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router();

// POST /api/auth/register - hash password (model hook), store user, return JWT
router.post('/register', requireFields('name', 'email', 'password'), async (req, res) => {
  const { name, email, password } = req.body;
  // role is never taken from the request: new accounts are always "staff"
  const user = await User.create({ name, email, password: String(password) });
  res.status(201).json({ success: true, token: signToken(user), user });
});

// POST /api/auth/login - verify password, return JWT
router.post('/login', requireFields('email', 'password'), async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(String(password)))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  res.json({ success: true, token: signToken(user), user });
});

// GET /api/auth/profile - only for authenticated requests
router.get('/profile', verifyToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

export default router;
