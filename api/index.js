// Vercel serverless entry point: runs the same Express app as server/src/server.js.
// The MongoDB connection is cached so warm invocations reuse it.
import app from '../server/src/app.js';
import { connectDB } from '../server/src/config/db.js';

let ready;

export default async function handler(req, res) {
  if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
    return res
      .status(500)
      .json({ success: false, message: 'Server is not configured: set MONGO_URI and JWT_SECRET in the Vercel project settings.' });
  }
  try {
    ready ??= connectDB();
    await ready;
  } catch (err) {
    ready = undefined; // retry on the next request
    console.error(`MongoDB connection failed: ${err.message}`);
    return res.status(503).json({ success: false, message: 'Database is unavailable. Please try again shortly.' });
  }
  return app(req, res);
}
