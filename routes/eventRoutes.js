import express from 'express';
import mongoose from 'mongoose';
import Event from '../models/Event.js';
import User from '../models/user.js';
import { verifyToken } from './middleware/authMiddleware.js';

const router = express.Router();

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getEventIdentifier = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { _id: id };
  }

  return { $or: [{ slug: id }, { customId: id }, { id }] };
};

const getEventOwnerEmail = (event) => normalizeEmail(event.creatorEmail || event.organizerEmail);

const findEventForUser = async (id, userEmail) => {
  const event = await Event.findOne(getEventIdentifier(id));

  if (!event) {
    return { event: null, status: 404 };
  }

  if (getEventOwnerEmail(event) !== userEmail) {
    return { event: null, status: 403 };
  }

  return { event, status: 200 };
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

const getUpcomingEvents = async (req, res) => {
  try {
    const events = await Event.find({ date: { $gte: getToday() } }).sort({ date: 1 });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

router.get('/', getUpcomingEvents);
router.get('/upcoming', getUpcomingEvents);

router.get('/recent', async (req, res) => {
  try {
    const events = await Event.find({ date: { $gte: getToday() } })
      .sort({ date: 1 })
      .limit(6);
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export const getJoinedEvents = async (req, res) => {
  try {
    const requestedEmail = normalizeEmail(req.query.userEmail || req.query.email);
    const userEmail = normalizeEmail(req.user.email);
    if (requestedEmail && requestedEmail !== userEmail) {
      return res.status(403).json({ message: 'You can only view your own joined events.' });
    }
    if (!userEmail) {
      return res.status(200).json([]);
    }

    const dbEvents = await Event.find({
      $or: [{ volunteers: userEmail }, { joinedUsers: userEmail }],
    }).sort({ date: 1 });

    const joinedSeeds = [];
    for (let i = 0; i < SEED_EVENTS.length; i++) {
      const set = seedJoinStore.get(i);
      if (set && set.has(userEmail)) {
        joinedSeeds.push(getSeedEvent(i));
      }
    }

    const joinedEvents = [...joinedSeeds, ...dbEvents].sort((left, right) => new Date(left.date) - new Date(right.date));
    res.status(200).json(joinedEvents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

router.get('/joined', verifyToken, getJoinedEvents);

router.get('/my-events', verifyToken, async (req, res) => {
  try {
    const requestedEmail = normalizeEmail(req.query.email || req.query.userEmail);
    const email = normalizeEmail(req.user.email);
    if (requestedEmail && requestedEmail !== email) {
      return res.status(403).json({ message: 'You can only view your own events.' });
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

const handleCreateEvent = async (req, res) => {
  try {
    const { title, description, category, location, date, volunteersNeeded, imageUrl } = req.body;
    const creatorEmail = normalizeEmail(req.user.email);

    if (!title || !date) {
      return res.status(400).json({ message: 'Title and date are required' });
    }

    const eventDate = new Date(date);
    if (Number.isNaN(eventDate.getTime())) {
      return res.status(400).json({ message: 'Invalid event date' });
    }

    if (eventDate < getToday()) {
      return res.status(400).json({ message: 'Event date must be in the future' });
    }

    const newEvent = new Event({
      title,
      description: description || '',
      category: category || 'General',
      location: location || '',
      date: eventDate,
      volunteersNeeded: Number(volunteersNeeded) || 1,
      organizerEmail: creatorEmail,
      creatorEmail,
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

const handleUpdateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = normalizeEmail(req.user.email);

    if (getSeedIndex(id) !== -1) {
      return res.status(404).json({ message: 'Seed demo events cannot be updated' });
    }

    const { event, status } = await findEventForUser(id, userEmail);
    if (!event) {
      return res
        .status(status)
        .json({ message: status === 403 ? 'You can only update your own events' : 'Event not found' });
    }

    const allowedFields = ['title', 'description', 'category', 'location', 'date', 'volunteersNeeded', 'imageUrl'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([field, value]) => allowedFields.includes(field) && value !== undefined)
    );

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'At least one event field is required' });
    }

    if ('date' in updates) {
      const eventDate = new Date(updates.date);
      if (Number.isNaN(eventDate.getTime())) {
        return res.status(400).json({ message: 'Invalid event date' });
      }
      if (eventDate < getToday()) {
        return res.status(400).json({ message: 'Event date must be in the future' });
      }
      updates.date = eventDate;
    }

    if ('volunteersNeeded' in updates) {
      const volunteerCount = Number(updates.volunteersNeeded);
      if (!Number.isFinite(volunteerCount) || volunteerCount < 1) {
        return res.status(400).json({ message: 'Volunteers needed must be at least 1' });
      }
      updates.volunteersNeeded = volunteerCount;
    }

    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: event._id,
        $or: [{ creatorEmail: userEmail }, { organizerEmail: userEmail }],
      },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedEvent) {
      return res.status(403).json({ message: 'You can only update your own events' });
    }

    res.status(200).json({ success: true, message: 'Event updated successfully', event: updatedEvent });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

router.put('/:id', verifyToken, handleUpdateEvent);

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = normalizeEmail(req.user.email);

    if (getSeedIndex(id) !== -1) {
      return res.status(404).json({ message: 'Seed demo events cannot be deleted' });
    }

    const { event, status } = await findEventForUser(id, userEmail);
    if (!event) {
      return res
        .status(status)
        .json({ message: status === 403 ? 'You can only delete your own events' : 'Event not found' });
    }

    await Event.deleteOne({ _id: event._id });

    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/leave', verifyToken, async (req, res) => {
  try {
    const userEmail = normalizeEmail(req.user.email);

    const seedIndex = getSeedIndex(req.params.id);
    if (seedIndex !== -1) {
      const emails = seedJoinStore.get(seedIndex) ?? new Set();
      emails.delete(userEmail);
      seedJoinStore.set(seedIndex, emails);
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

    await User.findOneAndUpdate({ email: userEmail }, { $pull: { joinedEvents: event._id } }).catch(() => null);

    res.status(200).json({ success: true, message: 'Successfully left the event!', event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/join', verifyToken, async (req, res) => {
  try {
    const userEmail = normalizeEmail(req.user.email);

    const seedIndex = getSeedIndex(req.params.id);
    if (seedIndex !== -1) {
      const emails = seedJoinStore.get(seedIndex) ?? new Set();
      emails.add(userEmail);
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

    await User.findOneAndUpdate(
      { email: userEmail },
      { $addToSet: { joinedEvents: event._id } },
      { upsert: true }
    ).catch(() => null);

    res.status(200).json({ success: true, message: 'Successfully joined event!', event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
