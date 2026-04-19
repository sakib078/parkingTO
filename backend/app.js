import express from 'express';
import { readFile } from 'fs/promises';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import multer from 'multer';
import bodyParser from 'body-parser';
import cors from 'cors';

dotenv.config();

import parkingRoutes from './routes/parkingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorMiddleware, notFoundMiddleware } from './middleware/errorMiddleware.js';

const app = express();

app.set('port', process.env.PORT || 4242);

const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const dbUriFromEnv = process.env.MONGODB_URI;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  const origin = process.env.FRONTEND_URL || "http://localhost:3000";
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: 'OPTIONS, GET, POST, PUT, PATCH, DELETE',
  allowedHeaders: 'Content-Type, Authorization'
}));

// Vercel Serverless DB Connection Pooling
app.use(async (req, res, next) => {
  // If already connected, safely continue
  if (mongoose.connection.readyState === 1) {
    return next();
  }
  
  try {
    const mongoUri = dbUriFromEnv || `mongodb+srv://${encodeURIComponent(dbUsername || '')}:${encodeURIComponent(dbPassword || '')}@cluster0.4twp21v.mongodb.net/?appName=Cluster0`;
    await mongoose.connect(mongoUri, { 
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB (Serverless pool)');
    next();
  } catch (err) {
    console.error('Mongoose cold-start connection failed:', err.message);
    // Send 500 immediately instead of hanging for 10 seconds!
    res.status(500).json({ success: false, message: 'Database connection failed. Check MongoDB IP Whitelist or Credentials.' });
  }
});


app.use('/api/admin', adminRoutes);
app.use('/api/park', parkingRoutes);

// 404 Not Found handler
app.use(notFoundMiddleware);

// Global Error Handler (MUST be last)
app.use(errorMiddleware);


if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(app.get('port'), async () => {
    try {
      const mongoUri = dbUriFromEnv || `mongodb+srv://${encodeURIComponent(dbUsername || '')}:${encodeURIComponent(dbPassword || '')}@cluster0.4twp21v.mongodb.net/?appName=Cluster0`;
      await mongoose.connect(mongoUri);
      isDbConnected = true;
      console.log('Connected to MongoDB successfully (Local)');
      console.log(`Server running on port http://localhost:${app.get('port')}/`);
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
    }
  });
}

export default app;