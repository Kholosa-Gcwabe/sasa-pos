const ApiResponse = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  console.error(`❌ Error: ${err.message}`);
  
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  if (err.code === 'P2002') {
    return ApiResponse.error(res, 'Resource already exists', 409);
  }
  if (err.code === 'P2025') {
    return ApiResponse.error(res, 'Resource not found', 404);
  }

  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(res, 'Invalid token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return ApiResponse.error(res, 'Token expired', 401);
  }

  ApiResponse.error(res, err.message || 'Internal server error', err.status || 500);
};

module.exports = errorHandler;
