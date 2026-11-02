import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const router = express.Router();

/**
 * POST /api/auth/jwt-token
 * Frontend authentication (Google or Email/Password) সফল হওয়ার পর
 * ব্যাকএন্ড থেকে সুরক্ষিত JWT Token জেনারেট করার জন্য।
 */
router.post('/jwt-token', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // মঙ্গোডিবিতে ইউজার না থাকলে আপডেট বা ক্রিয়েট (Upsert)
    let user = await User.findOneAndUpdate(
      { email: cleanEmail },
      { $setOnInsert: { email: cleanEmail, name: name || 'User' } },
      { upsert: true, new: true }
    );

    // JWT Token জেনারেট করা
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'servetogether_jwt_secret_2026',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
