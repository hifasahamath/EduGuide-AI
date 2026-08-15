/**
 * EduGuide-AI — Express Server Entry Point
 * 
 * Handles API routes for chat, courses, FAQs, training,
 * user management, analytics, and settings.
 * Auth is done via Supabase JWTs validated in middleware.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const chatRoutes = require('./routes/chatRoutes');
const courseRoutes = require('./routes/courseRoutes');
const faqRoutes = require('./routes/faqRoutes');
const trainingRoutes = require('./routes/trainingRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');

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
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, serverless same-origin)
    if (!origin) return callback(null, true);
    
    // In development or if explicitly allowed via wildcard/list
    if (NODE_ENV === 'development' || !process.env.ALLOWED_ORIGINS || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow any Vercel preview or production deployment domain
    try {
      const url = new URL(origin);
      if (url.hostname.endsWith('.vercel.app')) {
        return callback(null, true);
      }
    } catch {
      // Invalid URL string
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', limiter);

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/subscription-plans', subscriptionRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    error: 'An unexpected internal error occurred.',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 EduGuide AI server running on http://localhost:${PORT}`);
    console.log(`   Environment : ${NODE_ENV}`);
  });
}

module.exports = app;