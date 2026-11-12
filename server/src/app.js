import express from 'express';
import cors from 'cors';
import { logger } from './middleware/logger.js';
import { verifyToken } from './middleware/auth.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import courseRoutes from './routes/courses.js';
import statsRoutes from './routes/stats.js';

const app = express();

app.use(cors({ origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',') }));
app.use(express.json());
app.use(logger);

app.get('/', (_req, res) => res.json({ name: 'Enrolla API', docs: 'See README.md for the endpoint list' }));
app.get('/api/health', (_req, res) => res.json({ success: true, status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
// Everything below requires a valid JWT
app.use('/api/students', verifyToken, studentRoutes);
app.use('/api/courses', verifyToken, courseRoutes);
app.use('/api/stats', verifyToken, statsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
