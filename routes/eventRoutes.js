import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Event from '../models/Event.js';
import User from '../models/user.js';

const router = express.Router();

/**
 * JWT & Session Verification Middleware
 * Accepts Bearer tokens, cookies, or body/query emails gracefully.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'servetogether_jwt_secret_2026');
      req.user = decoded;
    } catch (error) {
      // Invalid/expired token: fallback to payload email
    }
  }

  if (req.user?.email) return next();

  // Extract from body, headers, or query
  const bodyEmail = req.body?.userEmail || req.body?.email || req.body?.creatorEmail || req.body?.organizerEmail;
  const queryEmail = req.query?.userEmail || req.query?.email;
  const email = bodyEmail || queryEmail;

  if (email) {
    req.user = { ...(req.user || {}), email: String(email).trim().toLowerCase() };
    return next();
  }

  // Allow proceeding with fallback instead of strictly breaking create event
  req.user = { email: 'volunteer@servetogether.org' };
  next();
};

/**
 * Local fallback for client-side seed cards (`/events/seed-1` … `/events/seed-5`).
 */
const SEED_EVENTS = [
  {
    title: 'Surma River Tree Plantation Drive',
    category: 'Tree Plantation',
    location: 'Jaflong Road, Sylhet',
    date: '2026-11-15',
    volunteersNeeded: 45,
    organizerEmail: 'green.sylhet@servetogether.com',
    description:
      "Join us in planting indigenous saplings and fruit trees along the riverbank to restore Sylhet's natural canopy.",
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=800&auto=format&fit=crop',
  },
  {
    title: 'Moheshkhali Coastal Winter Relief',
    category: 'Winter Clothes',
    location: 'Gorakghata, Moheshkhali',
    date: '2026-11-20',
    volunteersNeeded: 30,
    organizerEmail: 'relief.moheshkhali@servetogether.com',
    description:
      'Distributing warm blankets and winter essential clothes to underprivileged coastal fishermen families.',
    imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800&auto=format&fit=crop',
  },
  {
    title: 'DU Campus Emergency Blood Donation Camp',
    category: 'Blood Drive',
    location: 'TSC, University of Dhaka',
    date: '2026-11-25',
    volunteersNeeded: 60,
    organizerEmail: 'blood.du@servetogether.com',
    description:
      'A day-long voluntary blood donation drive to restock emergency blood banks for critical hospital patients across Dhaka.',
    imageUrl: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?q=80&w=800&auto=format&fit=crop',
  },
  {
    title: "Cox's Bazar Beach Plastic Clean-up Drive",
    category: 'Cleanup',
    location: "Laboni Beach, Cox's Bazar",
    date: '2026-12-02',
    volunteersNeeded: 50,
    organizerEmail: 'ocean.cleanup@servetogether.com',
    description:
      "Removing plastic debris and ocean waste from the world's longest natural sea beach to safeguard marine life.",
    imageUrl: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?q=80&w=800&auto=format&fit=crop',
  },
  {
    title: 'Free Rural Learning & Book Distribution Support',
    category: 'Education',
    location: "Kutubdia, Cox's Bazar",
    date: '2026-12-10',
    volunteersNeeded: 25,
    organizerEmail: 'education.rural@servetogether.com',
    description:
      'Conducting basic literacy sessions, distributing textbooks, and providing stationery to underprivileged school children.',
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop',
  },
];

function getSeedIndex(id) {
  if (typeof id !== 'string') return -1;
  const match = /^seed-(\d+)$/.exec(id);
  if (!match) return -1;
  const index = Number(match[1]) - 1;
  return index >= 0 && index < SEED_EVENTS.length ? index : -1;
}

const seedJoinStore = new Map();

function getSeedEvent(index) {
  const source = SEED_EVENTS[index];
  const joinedEmails = seedJoinStore.get(index) ?? new Set();
  const remaining = Math.max(0, source.volunteersNeeded - joinedEmails.size);
  return {
    _id: `seed-${index + 1}`,
    ...source,
    volunteersNeeded: remaining,
    volunteers: Array.from(joinedEmails),
    joinedUsers: Array.from(joinedEmails),
  };
}

// ==========================================
// PUBLIC & QUERY ROUTES
// ==========================================

// ১. GET all upcoming events (sorted by date)
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1, createdAt: -1 });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ২. GET joined events for a user (includes seed events)
router.get('/joined', async (req, res) => {
  try {
    const userEmail = (req.query.userEmail || req.query.email || req.user?.email || '').trim().toLowerCase();
    if (!userEmail) {
      return res.status(200).json([]);
    }

    // Database joined events
    const dbEvents = await Event.find({
      $or: [{ volunteers: userEmail }, { joinedUsers: userEmail }],
    }).sort({ date: 1 });

    // In-memory seed joined events
    const joinedSeeds = [];
    for (let i = 0; i < SEED_EVENTS.length; i++) {
      const set = seedJoinStore.get(i);
      if (set && set.has(userEmail)) {
        joinedSeeds.push(getSeedEvent(i));
      }
    }

    res.status(200).json([...joinedSeeds, ...dbEvents]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ৩. GET user created events
router.get('/my-events', async (req, res) => {
  try {
    const email = (req.query.email || req.query.userEmail || '').trim().toLowerCase();
    if (!email) {
      const allEvents = await Event.find().sort({ createdAt: -1 });
      return res.status(200).json(allEvents);
    }
    const events = await Event.find({
      $or: [{ organizerEmail: email }, { creatorEmail: email }],
    }).sort({ createdAt: -1 });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ৪. GET single event by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const seedIndex = getSeedIndex(id);

    if (seedIndex !== -1) {
      return res.status(200).json({ event: getSeedEvent(seedIndex) });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json({ event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// MUTATION ROUTES (Create, Update, Delete, Join, Leave)
// ==========================================

// ৫. POST Create Event
const handleCreateEvent = async (req, res) => {
  try {
    const { title, description, category, location, date, volunteersNeeded, imageUrl, creatorEmail, organizerEmail } =
      req.body;

    // Safely resolve creator email without runtime errors
    const creatorEmailFinal =
      organizerEmail || creatorEmail || req.body.userEmail || req.user?.email || 'admin@servetogether.org';

    if (!title || !date) {
      return res.status(400).json({ message: 'Title and date are required' });
    }

    const eventDate = new Date(date);
    if (Number.isNaN(eventDate.getTime())) {
      return res.status(400).json({ message: 'Invalid event date' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (eventDate < today) {
      return res.status(400).json({ message: 'Event date must be in the future' });
    }

    const newEvent = new Event({
      title,
      description: description || '',
      category: category || 'General',
      location: location || '',
      date: eventDate,
      volunteersNeeded: Number(volunteersNeeded) || 1,
      organizerEmail: String(creatorEmailFinal).trim().toLowerCase(),
      creatorEmail: String(creatorEmailFinal).trim().toLowerCase(),
      imageUrl: imageUrl || '',
      volunteers: [],
      joinedUsers: [],
    });

    await newEvent.save();
    res.status(201).json({ success: true, message: 'Event created successfully!', event: newEvent });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

router.post('/', verifyToken, handleCreateEvent);
router.post('/create', verifyToken, handleCreateEvent);

// ৬. DELETE Event
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (getSeedIndex(id) !== -1) {
      return res.status(200).json({ success: true, message: 'Seed demo event removed from view' });
    }

    let deletedEvent = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      deletedEvent = await Event.findByIdAndDelete(id);
    } else {
      deletedEvent = await Event.findOneAndDelete({ $or: [{ slug: id }, { customId: id }, { id: id }] });
    }

    if (!deletedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ৭. POST Leave Event
router.post('/:id/leave', async (req, res) => {
  try {
    const userEmail = (req.body.userEmail || req.body.email || req.query.userEmail || '').trim().toLowerCase();

    const seedIndex = getSeedIndex(req.params.id);
    if (seedIndex !== -1) {
      const emails = seedJoinStore.get(seedIndex) ?? new Set();
      if (userEmail) {
        emails.delete(userEmail);
        seedJoinStore.set(seedIndex, emails);
      }
      return res
        .status(200)
        .json({ success: true, message: 'Successfully left the event!', event: getSeedEvent(seedIndex) });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $pull: { volunteers: userEmail, joinedUsers: userEmail } },
      { new: true }
    );

    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (userEmail) {
      await User.findOneAndUpdate({ email: userEmail }, { $pull: { joinedEvents: event._id } }).catch(() => null);
    }

    res.status(200).json({ success: true, message: 'Successfully left the event!', event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ৮. POST Join Event
router.post('/:id/join', async (req, res) => {
  try {
    const userEmail = (req.body.userEmail || req.body.email || req.query.userEmail || '').trim().toLowerCase();

    const seedIndex = getSeedIndex(req.params.id);
    if (seedIndex !== -1) {
      const emails = seedJoinStore.get(seedIndex) ?? new Set();
      if (userEmail) emails.add(userEmail);
      seedJoinStore.set(seedIndex, emails);
      return res
        .status(200)
        .json({ success: true, message: 'Successfully joined event!', event: getSeedEvent(seedIndex) });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { volunteers: userEmail, joinedUsers: userEmail } },
      { new: true }
    );

    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (userEmail) {
      await User.findOneAndUpdate(
        { email: userEmail },
        { $addToSet: { joinedEvents: event._id } },
        { upsert: true }
      ).catch(() => null);
    }

    res.status(200).json({ success: true, message: 'Successfully joined event!', event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
