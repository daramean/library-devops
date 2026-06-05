const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';

  // Postgres unique violation
  if (err.code === '23505') {
    statusCode = 409;
    if (err.detail?.includes('isbn')) {
      message = 'A book with this ISBN already exists. Leave ISBN blank if you\'re adding a different copy.';
    } else if (err.detail?.includes('email')) {
      message = 'This email is already registered';
    } else if (err.detail?.includes('name')) {
      message = 'This name already exists';
    } else {
      message = 'Duplicate entry — resource already exists';
    }
  }
  // Postgres foreign key violation
  if (err.code === '23503') {
    statusCode = 400;
    message    = 'Referenced resource does not exist';
  }
  // Postgres not-null violation
  if (err.code === '23502') {
    statusCode = 400;
    message = 'A required field is missing or empty';
  }
  // Postgres invalid input syntax
  if (err.code === '22P02') {
    statusCode = 400;
    message = 'Invalid input syntax: please check numeric or date fields.';
  }
  // Postgres undefined column (schema mismatch)
  if (err.code === '42703') {
    statusCode = 500;
    message = 'Database schema mismatch: missing column or invalid column name. Run migrations.';
  }
  // Multer file upload errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.message || 'Invalid file upload';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError')  { statusCode = 401; message = 'Invalid token'; }
  if (err.name === 'TokenExpiredError')  { statusCode = 401; message = 'Token expired'; }

  if (statusCode >= 500) {
    logger.error({ err, url: req.url, method: req.method });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
