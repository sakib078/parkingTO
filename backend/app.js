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
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(cors({
  origin: 'http://localhost:3000',
  methods: 'OPTIONS, GET, POST, PUT, PATCH, DELETE',
  allowedHeaders: 'Content-Type, Authorization'
}));


app.use('/admin', adminRoutes);
app.use('/park', parkingRoutes);

// 404 Not Found handler
app.use(notFoundMiddleware);

// Global Error Handler (MUST be last)
app.use(errorMiddleware);


app.listen(app.get('port'), async () => {
  try {
    const mongoUri = dbUriFromEnv || `mongodb+srv://${encodeURIComponent(dbUsername || '')}:${encodeURIComponent(dbPassword || '')}@cluster0.4twp21v.mongodb.net/?appName=Cluster0`;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully');
    console.log(`Server running on port http://localhost:${app.get('port')}/`);

  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
});