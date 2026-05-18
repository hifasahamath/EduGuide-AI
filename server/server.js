const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const chatRoutes = require('./routes/chatRoutes');
const courseRoutes = require('./routes/courseRoutes');
const faqRoutes = require('./routes/faqRoutes');
const trainingRoutes = require('./routes/trainingRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});

// Middleware
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────────────
// In development: allow all origins. In production: restrict to ALLOWED_ORIGINS.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, Vercel serverless, same-origin)
    if (!origin) return callback(null, true);
    // In development, allow all origins
    if (NODE_ENV === 'development') return callback(null, true);
    // In production, check against allowedOrigins
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
// Pre-flight: Express 5 requires named wildcard /{*path} instead of bare *
app.options('/{*path}', cors(corsOptions));

app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', limiter);

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);

// Add manual training endpoint directly or via routes
app.post('/api/train', async (req, res) => {
  const dbService = require('./services/dbService');
  const { user_input, response } = req.body;
  if (!user_input || !response) {
    return res.status(400).json({ error: 'Missing user_input or response' });
  }
  try {
    await dbService.saveTrainingData(user_input, response);
    res.json({ message: 'Training data added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add training data' });
  }
});

// Get history
app.get('/api/history', async (req, res) => {
  const dbService = require('./services/dbService');
  const userId = req.query.userId || 'default_user';
  try {
    const history = await dbService.getChatHistory(userId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get chat history' });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({
    error: 'An unexpected internal error occurred.',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ── Start server (local dev only) ─────────────────────────────────────────────
// When imported by a serverless handler (Vercel/Netlify), require.main !== module
// so the server will NOT try to listen on a port — it just exports the app.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 EduGuide AI server running on http://localhost:${PORT}`);
    console.log(`   Environment : ${NODE_ENV}`);
    console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`);
  });
}

module.exports = app;