const path = require('path');
require('express-async-errors');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');

const { setupSwagger } = require('./config/swagger');
const authRoutes = require('./routes/auth.routes');
const bookRoutes = require('./routes/book.routes');
const {
  borrowRoutes,
  dashboardRoutes,
  categoryRoutes,
  userRoutes,
  fineRoutes,
  notificationRoutes,
  activityRoutes,
  reservationRoutes,
} = require('./routes/index.routes');
const { metricsMiddleware, metricsRoute } = require('./utils/metrics');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

const app = express();

app.use(helmet());
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
const allowedOrigins = Array.isArray(corsOrigin)
  ? corsOrigin
  : corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean);

const defaultOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3002',
];

const isLocalhostOrigin = (origin) => {
  try {
    const url = new URL(origin);
    return (
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1') &&
      ['http:', 'https:'].includes(url.protocol)
    );
  } catch {
    return false;
  }
};

const originChecker = (origin, callback) => {
  if (!origin) {
    return callback(null, true);
  }

  const validOrigins = [...new Set([...allowedOrigins, ...defaultOrigins])];

  if (validOrigins.includes(origin) || isLocalhostOrigin(origin)) {
    return callback(null, true);
  }

  return callback(new Error(`CORS origin denied: ${origin}`));
};

app.use(cors({ origin: originChecker, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));
app.use(metricsMiddleware);

// Serve uploaded cover images
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/metrics', metricsRoute);

const v1 = '/api/v1';
app.use(`${v1}/auth`, authRoutes);
app.use(`${v1}/books`, bookRoutes);
app.use(`${v1}/borrows`, borrowRoutes);
app.use(`${v1}/dashboard`, dashboardRoutes);
app.use(`${v1}/categories`, categoryRoutes);
app.use(`${v1}/users`, userRoutes);
app.use(`${v1}/fines`, fineRoutes);
app.use(`${v1}/notifications`, notificationRoutes);
app.use(`${v1}/activity`, activityRoutes);
app.use(`${v1}/reservations`, reservationRoutes);

setupSwagger(app);

app.all('*', (req, res, next) => next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404)));
app.use(errorHandler);

module.exports = app;
