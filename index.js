import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import eventRoutes from './routes/eventRoutes.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS কনফিগারেশন: Credentials এবং Origin সুনির্দিষ্ট করা হলো
app.use(
  cors({
    origin: ['http://localhost:3000', 'https://serve-together-client.vercel.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

// Root Endpoint
app.get('/', (req, res) => {
  res.send({ status: 'ok', message: 'ServeTogether Server Running' });
});

// API Routes
app.use('/api/events', eventRoutes);
app.use('/api/auth', authRoutes);

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to database:', error);
  }
}

startServer();
