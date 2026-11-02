import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const router = express.Router();

/**
 * POST /api/auth/jwt-token
 * Frontend authentication (Google or Email/Password) সফল হওয়ার পর
 * ব্যাকএন্ড থেকে সুরক্ষিত JWT Token জেনারেট করার জন্য।
 */
router.post('/jwt-token', async (req, res) => {
  try {
    const { email, name, image } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // মঙ্গোডিবিতে ইউজার না থাকলে তৈরি হবে, থাকলে তথ্য ঠিক থাকবে
    let user = await User.findOneAndUpdate(
      { email: cleanEmail },
      {
        $setOnInsert: {
          email: cleanEmail,
          name: name || 'User',
          image: image || '',
        },
      },
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
        image: user.image || '',
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/auth/profile
 * ইউজারের নাম ও প্রোফাইল ছবি আপডেট করার জন্য।
 */
router.put('/profile', async (req, res) => {
  try {
    const { email, name, image } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // ইউজারের নাম এবং ছবির ফিল্ড আপডেট করা
    const updatedUser = await User.findOneAndUpdate(
      { email: cleanEmail },
      {
        $set: {
          ...(name && { name: name.trim() }),
          ...(image !== undefined && { image: image.trim() }),
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        image: updatedUser.image || '',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
