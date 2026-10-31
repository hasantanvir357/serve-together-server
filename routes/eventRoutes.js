import { Router } from 'express';
import Event from '../models/Event.js';

const router = Router();

// POST /api/events - create a new event
router.post('/', async (req, res) => {
  try {
    const event = await Event.create(req.body);
    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid event data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create event', error: error.message });
  }
});

// GET /api/events - fetch all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.status(200).json({ message: 'Events fetched successfully', events });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch events', error: error.message });
  }
});

export default router;
