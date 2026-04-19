/**
 * Error Handler Utility
 * Centralized error handling and formatting
 */

/**
 * Custom Application Error Class
 */
export class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error
 */
export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication Error
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', details = null) {
    super(message, 401, details);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization Error
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions', details = null) {
    super(message, 403, details);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not Found Error
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource', details = null) {
    super(`${resource} not found`, 404, details);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict Error (e.g., duplicate entry)
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', details = null) {
    super(message, 409, details);
    this.name = 'ConflictError';
  }
}

/**
 * Server Error
 */
export class ServerError extends AppError {
  constructor(message = 'Internal server error', details = null) {
    super(message, 500, details);
    this.name = 'ServerError';
  }
}

/**
 * Format error response
 */
export const formatErrorResponse = (error) => {
  if (error instanceof AppError) {
    return {
      success: false,
      statusCode: error.statusCode,
      message: error.message,
      details: error.details,
      timestamp: error.timestamp,
    };
  }

  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors).map((err) => err.message);
    return {
      success: false,
      statusCode: 400,
      message: 'Validation error',
      details: details,
      timestamp: new Date().toISOString(),
    };
  }

  // Handle Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return {
      success: false,
      statusCode: 409,
      message: `${field} already exists`,
      details: [`Duplicate entry for ${field}`],
      timestamp: new Date().toISOString(),
    };
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return {
      success: false,
      statusCode: 401,
      message: 'Invalid token',
      details: [error.message],
      timestamp: new Date().toISOString(),
    };
  }

  if (error.name === 'TokenExpiredError') {
    return {
      success: false,
      statusCode: 401,
      message: 'Token expired',
      details: ['Please login again'],
      timestamp: new Date().toISOString(),
    };
  }

  // Default error
  return {
    success: false,
    statusCode: error.statusCode || 500,
    message: error.message || 'Internal server error',
    details: error.details || null,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Log error to console/logger (can be extended with logging service)
 */
export const logError = (error, context = 'Unknown') => {
  const timestamp = new Date().toISOString();

  if (error instanceof AppError) {
    console.error(`[${timestamp}] [${context}] ${error.name}: ${error.message}`);
    if (error.details) {
      console.error('Details:', error.details);
    }
  } else {
    console.error(`[${timestamp}] [${context}] ${error.name || 'Error'}: ${error.message}`);
    console.error('Stack:', error.stack);
  }
};

/**
 * Async handler wrapper - catches async errors and passes to error middleware
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validate error object structure
 */
export const isValidError = (error) => {
  return (
    error instanceof AppError ||
    error instanceof Error ||
    (typeof error === 'object' && error.message)
  );
};

/**
 * Get error message for logging
 */
export const getErrorMessage = (error) => {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
};

/**
 * Get HTTP status code from error
 */
export const getStatusCode = (error) => {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  if (error.statusCode) {
    return error.statusCode;
  }
  return 500;
};
