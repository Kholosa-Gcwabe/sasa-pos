require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'fallback-secret',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
