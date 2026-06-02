import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db/database.js';
import { env } from './config/env.js';
import authRoutes from './routes/auth.js';
import scalesRoutes from './routes/scales.js';
import progressRoutes from './routes/progress.js';
import quizRoutes from './routes/quiz.js';
import earRoutes from './routes/ear.js';
import chordsRoutes from './routes/chords.js';
import songsRoutes from './routes/songs.js';
import achievementsRoutes from './routes/achievements.js';
import lessonsRoutes from './routes/lessons.js';
import {
  apiRateLimiter,
  authRateLimiter,
  sanitizeInput,
  securityHeaders,
} from './middleware/security.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = env.PORT;

initDatabase();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(securityHeaders);
app.use(
  cors({
    origin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',').map((item) => item.trim()) : true,
    credentials: true,
  })
);
app.use(express.json({ limit: '100kb' }));
app.use(sanitizeInput);
app.use('/api', apiRateLimiter);
app.use('/api/auth', authRateLimiter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Know Your Scales' });
});

app.use('/api/auth', authRoutes);
app.use('/api/scales', scalesRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/ear', earRoutes);
app.use('/api/chords', chordsRoutes);
app.use('/api/songs', songsRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/lessons', lessonsRoutes);

const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'API route not found' });
    return;
  }
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) res.status(404).send('Not found');
  });
});

const currentFile = fileURLToPath(import.meta.url);
const isMain = process.argv[1] === currentFile;

if (isMain) {
  app.listen(PORT, () => {
    console.log(`Know Your Scales API running on http://localhost:${PORT}`);
  });
}

export default app;
