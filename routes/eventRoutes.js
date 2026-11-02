import express from 'express';
import mongoose from 'mongoose';
import Event from '../models/Event.js';
import User from '../models/user.js';

const router = express.Router();

/**
 * Local fallback for client-side seed cards (`/events/seed-1` … `/events/seed-5`).
 *
 * These IDs are not Mongo ObjectIds, so `findById` would throw a CastError and
 * return a 500 for every dummy card. Instead we resolve them here (and track
 * in-memory joins per server process) so any card can be viewed and joined.
 * Run `POST /api/events/seed` to persist the same events into MongoDB.
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

// seedIndex for a non-ObjectId param like "seed-3" (0-based), or -1 when unknown.
function getSeedIndex(id) {
  if (typeof id !== 'string') return -1;
  const match = /^seed-(\d+)$/.exec(id);
  if (!match) return -1;
  const index = Number(match[1]) - 1;
  return index >= 0 && index < SEED_EVENTS.length ? index : -1;
}

// In-memory joins for seed events: Map<seedIndex, Set<email>>.
const seedJoinStore = new Map();

// Build a seed event response, overlaying any in-memory join state.
function getSeedEvent(index) {
  const source = SEED_EVENTS[index];
  const joinedEmails = seedJoinStore.get(index) ?? new Set();
  const remaining = Math.max(0, source.volunteersNeeded - joinedEmails.size);
  return {
    _id: `seed-${index + 1}`,
    ...source,
    volunteersNeeded: remaining,
    joinedUsers: Array.from(joinedEmails),
  };
}

// ১. GET all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ২. GET joined events for a user
router.get('/joined', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(200).json([]);
    }
    const cleanEmail = email.trim().toLowerCase();
    const events = await Event.find({ joinedUsers: cleanEmail }).sort({ date: 1 });

    // Seed events (`seed-N`) have no Mongo document, so Event.find() can't
    // see them — include the ones this user joined via the in-memory store.
    const joinedSeeds = Array.from(seedJoinStore.entries())
      .filter(([, emails]) => emails.has(cleanEmail))
      .map(([index]) => getSeedEvent(index));

    res.status(200).json([...events, ...joinedSeeds]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ৩. GET user created events (Manage Events)
router.get('/my-events', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      const allEvents = await Event.find().sort({ createdAt: -1 });
      return res.status(200).json(allEvents);
    }
    const cleanEmail = email.trim().toLowerCase();
    const events = await Event.find({ organizerEmail: cleanEmail }).sort({ createdAt: -1 });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ৪. POST Seed events (৫টি ক্যাটাগরির Bangladesh Dummy Data)
router.post('/seed', async (req, res) => {
  try {
    const sampleEvents = [
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

    await Event.insertMany(sampleEvents);
    res.status(201).json({ message: 'Sample events seeded successfully!', events: sampleEvents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ৫. POST Create Event Handler
const handleCreateEvent = async (req, res) => {
  try {
    const { title, description, category, location, date, volunteersNeeded, organizerEmail, imageUrl } = req.body;

    const newEvent = new Event({
      title,
      description,
      category,
      location,
      date,
      volunteersNeeded: Number(volunteersNeeded) || 1,
      organizerEmail: organizerEmail ? organizerEmail.trim().toLowerCase() : 'jamalkodu@gmail.com',
      imageUrl: imageUrl || '',
      joinedUsers: [],
    });

    await newEvent.save();
    res.status(201).json({ success: true, message: 'Event created successfully!', event: newEvent });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

router.post('/', handleCreateEvent);
router.post('/create', handleCreateEvent);

// ৬. GET single event by ID (handles Mongo ObjectIds and `seed-N` strings safely)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const seedIndex = getSeedIndex(id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      // Dummy card from the static feed: serve it from the local fallback
      // array instead of crashing with a MongoDB CastError (500).
      if (seedIndex !== -1) {
        return res.status(200).json({ event: getSeedEvent(seedIndex) });
      }
      return res.status(404).json({ message: 'Event not found' });
    }

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json({ event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ৭. DELETE Event
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      // Seed events are static demos in memory — deleting them is a no-op.
      if (getSeedIndex(id) !== -1) {
        return res.status(200).json({ success: true, message: 'Seed event cannot be deleted' });
      }
      return res.status(404).json({ message: 'Event not found' });
    }

    const deletedEvent = await Event.findByIdAndDelete(id);
    if (!deletedEvent) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ৮. POST Leave/Cancel Event
router.post('/:id/leave', async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    // Seed events have no Mongo document: mutate the in-memory join store instead.
    const seedIndex = getSeedIndex(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(req.params.id) && seedIndex !== -1) {
      const emails = seedJoinStore.get(seedIndex) ?? new Set();
      if (cleanEmail) {
        emails.delete(cleanEmail);
        seedJoinStore.set(seedIndex, emails);
      }
      return res
        .status(200)
        .json({ success: true, message: 'Successfully left the event!', event: getSeedEvent(seedIndex) });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.joinedUsers && event.joinedUsers.includes(cleanEmail)) {
      event.joinedUsers = event.joinedUsers.filter((e) => e !== cleanEmail);
      event.volunteersNeeded += 1;
      await event.save();
    }

    if (cleanEmail) {
      await User.findOneAndUpdate({ email: cleanEmail }, { $pull: { joinedEvents: event._id } }).catch(() => null);
    }

    res.status(200).json({ success: true, message: 'Successfully left the event!', event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ৯. POST Join Event
router.post('/:id/join', async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    // Seed events have no Mongo document: join via the in-memory store so
    // "Join as Volunteer" also works on the static dummy cards.
    const seedIndex = getSeedIndex(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(req.params.id) && seedIndex !== -1) {
      const emails = seedJoinStore.get(seedIndex) ?? new Set();
      if (cleanEmail && emails.has(cleanEmail)) {
        return res.status(400).json({ message: 'You have already joined this event' });
      }
      if (cleanEmail) emails.add(cleanEmail);
      seedJoinStore.set(seedIndex, emails);
      return res
        .status(200)
        .json({ success: true, message: 'Successfully joined event!', event: getSeedEvent(seedIndex) });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (cleanEmail && event.joinedUsers && event.joinedUsers.includes(cleanEmail)) {
      return res.status(400).json({ message: 'You have already joined this event' });
    }

    if (event.volunteersNeeded > 0) {
      event.volunteersNeeded -= 1;
      if (!event.joinedUsers) event.joinedUsers = [];
      if (cleanEmail) event.joinedUsers.push(cleanEmail);
      await event.save();
    }

    if (cleanEmail) {
      await User.findOneAndUpdate(
        { email: cleanEmail },
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
