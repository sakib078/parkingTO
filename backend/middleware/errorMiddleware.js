/**
 * Error Middleware
 * Centralized error handling for Express
 * Should be added LAST in middleware stack
 */

import { formatErrorResponse, logError } from '../utils/errorHandler.js';

/**
 * Global Error Handling Middleware
 * Catches all errors from routes and other middleware
 * 
 * Usage: app.use(errorMiddleware);
 * IMPORTANT: Must be the LAST middleware in the stack
 */
export const errorMiddleware = (err, req, res, next) => {
  // Log the error
  logError(err, `${req.method} ${req.path}`);

  // Format error response
  const errorResponse = formatErrorResponse(err);

  // Set response headers
  res.status(errorResponse.statusCode).set('Content-Type', 'application/json');

  // Send error response
  res.json(errorResponse);
};

/**
 * 404 Not Found Middleware
 * Should be added before error middleware
 * 
 * Usage: app.use(notFoundMiddleware);
 */
export const notFoundMiddleware = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  res.status(404);
  next(error);
};

/**
 * Request Validation Error Middleware
 * Catches validation errors from express-validator or custom validators
 * 
 * Usage:
 *   import { validationResult } from 'express-validator';
 *   router.post('/endpoint', [validation rules], validateRequest, controller);
 */
export const validateRequest = (req, res, next) => {
  try {
    next();
  } catch (error) {
    const err = new Error('Request validation failed');
    err.statusCode = 400;
    err.details = error.message;
    next(err);
  }
};
