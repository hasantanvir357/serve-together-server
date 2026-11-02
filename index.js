import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import eventRoutes from './routes/eventRoutes.js';
import authRoutes from './routes/auth.js'; // 1. Auth Routes ইম্পোর্ট করা হলো

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Root Endpoint
app.get('/', (req, res) => {
  res.send({ status: 'ok', message: 'ServeTogether Server Running' });
});

// API Routes
app.use('/api/events', eventRoutes);
app.use('/api/auth', authRoutes); // 2. Auth Routes এন্ডপয়েন্ট রেজিস্টার করা হলো

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
