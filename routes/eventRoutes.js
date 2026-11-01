import express from 'express';
import Event from '../models/Event.js';
const router = express.Router();

// 1. GET all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. GET single event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. POST Seed events (Initial Bangladesh dummy data)
router.post('/seed', async (req, res) => {
  try {
    const sampleEvents = [
      {
        title: "Cox's Bazar Beach Plastic Clean-up Drive",
        category: 'Cleanup',
        location: "Laboni Beach, Cox's Bazar",
        date: '2026-11-15',
        volunteersNeeded: 35,
        description:
          "Join us in removing marine plastic debris and ocean waste from the world's longest natural sea beach.",
        imageUrl: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?q=80&w=800',
      },
      {
        title: 'Sylhet Green Canopy Plantation Drive',
        category: 'Tree Plantation',
        location: 'Jaflong Road, Sylhet',
        date: '2026-11-20',
        volunteersNeeded: 50,
        description:
          'A major reforestation effort focused on planting fruit-bearing and indigenous forest trees across Sylhet.',
        imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=800',
      },
      {
        title: 'Moheshkhali Coastal Winter Relief',
        category: 'Winter Clothes',
        location: 'Gorakghata, Moheshkhali',
        date: '2026-12-05',
        volunteersNeeded: 20,
        description: 'Distributing warm blankets and winter essentials to underprivileged coastal fishermen families.',
        imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800',
      },
      {
        title: 'DU Campus Voluntary Blood Drive',
        category: 'Blood Drive',
        location: 'TSC, University of Dhaka',
        date: '2026-11-10',
        volunteersNeeded: 40,
        description: 'A day-long voluntary blood donation drive to restock emergency blood banks across Dhaka city.',
        imageUrl: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?q=80&w=800',
      },
    ];

    await Event.insertMany(sampleEvents);
    res.status(201).json({ message: 'Sample events seeded successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// POST /api/events/:id/join
router.post('/:id/join', async (req, res) => {
  try {
    const { email } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user already joined
    if (event.joinedUsers && event.joinedUsers.includes(email)) {
      return res.status(400).json({ message: 'You have already joined this event' });
    }

    if (event.volunteersNeeded > 0) {
      event.volunteersNeeded -= 1;

      // Save joined user email if array exists
      if (!event.joinedUsers) event.joinedUsers = [];
      if (email) event.joinedUsers.push(email);

      await event.save();
    }

    res.status(200).json({ success: true, event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/joined
router.get('/joined', async (req, res) => {
  try {
    const { email } = req.query;
    let query = {};

    if (email) {
      query = { joinedUsers: email };
    } else {
      query = { joinedUsers: { $exists: true, $not: { $size: 0 } } };
    }

    const events = await Event.find(query).sort({ date: 1 });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/my-events -> Fetch user created events
router.get('/my-events', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email query parameter is required' });

    const events = await Event.find({ creatorEmail: email }).sort({ date: -1 });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
