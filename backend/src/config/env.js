require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];

function validateEnv() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

validateEnv();

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: parseInt(process.env.PORT, 10) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5500',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
};
