import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

import itemRoutes from './routes/itemRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import authRoutes from './routes/authRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

dotenv.config();
connectDB();

const app = express();

// ✅ Define allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://starosecyber.netlify.app'
];

// ✅ Configure CORS dynamically
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// ✅ Health check route
app.get('/', (req, res) => {
  res.send('✅ Starose API is running...');
});

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);

// ✅ Middleware for errors
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'production'} mode on port ${PORT}`)
);
