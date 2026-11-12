import express from 'express';
import cors from 'cors';
import { logger, verifyToken, notFound, errorHandler } from './middleware.js';
import { authRouter, studentRouter, courseRouter, statsRouter } from './routes.js';

const app = express();

app.use(cors({ origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',') }));
app.use(express.json());
app.use(logger);

app.get('/', (_req, res) => res.json({ name: 'Enrolla API', docs: 'See README.md for the endpoint list' }));
app.get('/api/health', (_req, res) => res.json({ success: true, status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRouter);
// Everything below requires a valid JWT
app.use('/api/students', verifyToken, studentRouter);
app.use('/api/courses', verifyToken, courseRouter);
app.use('/api/stats', verifyToken, statsRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
