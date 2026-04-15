/**
 * EXO — Intelligent Stadium Experience Platform
 * Refactored Express Server
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const logger = require('./services/logger');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 8080;

// ─── Security Middleware ─────────────────────────────────────────────

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com", "https://www.gstatic.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://*.google.com", "https://*.gstatic.com"],
      connectSrc: ["'self'", "https://*.firebaseio.com", "https://*.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(compression());
app.use(rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { 
  maxAge: '1d',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
  }
}));

// ─── API Routes ──────────────────────────────────────────────────────

app.use('/api', apiRoutes);

// ─── Page Routes ─────────────────────────────────────────────────────

const pages = ['stadium', 'concessions', 'restrooms', 'admin'];
pages.forEach(page => {
  app.get(`/${page}`, (req, res) => res.sendFile(path.join(__dirname, 'public', `${page}.html`)));
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ─── Error Handling ──────────────────────────────────────────────────

app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  logger.error('Unhandled Server Error', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ─── Start Server ────────────────────────────────────────────────────

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`EXO Stadium Platform starting on port ${PORT}`);
    console.log(`\n  ╔══════════════════════════════════════╗`);
    console.log(`  ║   EXO Stadium Platform — Live 🏟️     ║`);
    console.log(`  ║   http://localhost:${PORT}              ║`);
    console.log(`  ╚══════════════════════════════════════╝\n`);
  });
}

module.exports = app;
