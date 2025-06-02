const { logger } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error:', err);

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        message: err.message,
        code: 'VALIDATION_ERROR'
      }
    });
  }

  // Handle gRPC errors
  if (err.code) {
    const statusMap = {
      INVALID_ARGUMENT: 400,
      NOT_FOUND: 404,
      ALREADY_EXISTS: 409,
      PERMISSION_DENIED: 403,
      UNAUTHENTICATED: 401,
      RESOURCE_EXHAUSTED: 429,
      FAILED_PRECONDITION: 400,
      ABORTED: 409,
      OUT_OF_RANGE: 400,
      UNIMPLEMENTED: 501,
      INTERNAL: 500,
      UNAVAILABLE: 503,
      DATA_LOSS: 500
    };

    const status = statusMap[err.code] || 500;
    return res.status(status).json({
      error: {
        message: err.message,
        code: err.code
      }
    });
  }

  // Handle unknown errors
  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR'
    }
  });
};

module.exports = { errorHandler }; 