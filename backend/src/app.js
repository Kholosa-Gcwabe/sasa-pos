const express = require('express');
const cors = require('cors');
const path = require('path');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');

const app = express();

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      env.FRONTEND_URL,
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'http://localhost:3000'
    ];
    if (allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.warn(`🚫 Blocked CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

app.use(express.static(path.join(__dirname, '../../frontend')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend', 'index.html'));
});

app.use(errorHandler);

module.exports = { app };
