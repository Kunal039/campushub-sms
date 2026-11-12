import 'dotenv/config';
import app from './app.js';
import { connectDB } from './models.js';

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Copy server/.env.example to server/.env and fill it in.');
  process.exit(1);
}

try {
  await connectDB();
  app.listen(PORT, () => console.log(`Enrolla API running on http://localhost:${PORT}`));
} catch (err) {
  console.error(`Could not connect to MongoDB: ${err.message}`);
  console.error('Is MongoDB running? Check MONGO_URI in server/.env');
  process.exit(1);
}
