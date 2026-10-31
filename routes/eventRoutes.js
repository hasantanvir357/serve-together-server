import { Router } from 'express';
import Event from '../models/Event.js';

const router = Router();

// Sample volunteer events for Bangladesh
const seedEvents = [
  {
    title: 'Tree Plantation Drive at Ratargul Swamp Forest',
    description:
      'Join a full-day plantation campaign in the Ratargul wetland near Sylhet. Volunteers will plant 1,000 saplings of gamar, hijal and koroch trees along the eroding forest edge and learn basic wetland conservation techniques from local forest department staff. Seedlings, tools, lunch and transport from Sylhet town are provided — just bring your enthusiasm and rain gear.',
    category: 'Environment',
    location: 'Ratargul Swamp Forest, Sylhet',
    date: new Date('2026-11-15T09:00:00+06:00'),
    volunteersNeeded: 60,
    organizerEmail: 'shahriar.hassan@gmail.com',
    imageUrl:
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Winter Clothes Drive for Cold-Hit Families in Cox\u2019s Bazar',
    description:
      'Before peak winter sets in, help collect, sort and distribute blankets, sweaters and jackets among Rohingya refugee and host-community families in Ukhiya, Cox\u2019s Bazar. Volunteers will prepare donation kits at the collection hub and hand them door-to-door at Camp 4 Extension. Every kit keeps a family of four warm through December and January.',
    category: 'Disaster Relief',
    location: 'Ukhiya, Cox\u2019s Bazar',
    date: new Date('2026-12-05T10:00:00+06:00'),
    volunteersNeeded: 40,
    organizerEmail: 'nusrat.jahan@yahoo.com',
    imageUrl:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Inani Beach Cleanup & Plastic Audit',
    description:
      'Spend an early morning clearing plastic waste from the Inani shoreline south of Cox\u2019s Bazar town. Teams will collect and segregate marine litter, record the most common plastic items in an audit sheet, and hand sorted waste to the municipal recycling partner. Gloves, bags, water and breakfast are provided; sunrise views over the Bay of Bengal are free.',
    category: 'Environment',
    location: 'Inani Beach, Cox\u2019s Bazar',
    date: new Date('2026-11-22T06:30:00+06:00'),
    volunteersNeeded: 80,
    organizerEmail: 'tanvir.ahmed@bracu.ac.bd',
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Flood Relief Distribution in Sunamganj Haor',
    description:
      'Support post-monsoon relief efforts in the Tahirpur upazila of Sunamganj, where flash floods have displaced hundreds of haor families. Volunteers will help unload and distribute dry food, oral rehydration salts, water purification tablets and tarpaulin sheets at relief points, and assist in repairing the embankment of a flooded primary school. Boat transport from Sunamganj town is arranged by the organizers.',
    category: 'Disaster Relief',
    location: 'Tahirpur, Sunamganj',
    date: new Date('2026-11-08T08:00:00+06:00'),
    volunteersNeeded: 50,
    organizerEmail: 'rezaul.karim@gmail.com',
    imageUrl:
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Free Health Camp & Blood Donation Drive at BRAC University',
    description:
      'A one-day free health camp and blood donation drive in partnership with the Thalassemia Foundation Bangladesh, open to students, faculty and nearby residents of Merul Badda, Dhaka. Registered volunteers will guide donors through registration, assist the medical team with blood pressure checks, and help serve refreshments to donors. Last year\u2019s drive collected 212 bags of blood — let\u2019s beat that record.',
    category: 'Health',
    location: 'BRAC University, Merul Badda, Dhaka',
    date: new Date('2026-11-01T09:00:00+06:00'),
    volunteersNeeded: 30,
    organizerEmail: 'farhana.islam@gmail.com',
    imageUrl:
      'https://images.unsplash.com/photo-1615461066841-6116e61058f6?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Community Kitchen & Food Distribution in Korail Slum',
    description:
      'Help cook and distribute warm evening meals to daily-wage workers and families in the Korail slum beside Banani Lake, Dhaka. Volunteers are needed for grocery shopping in the morning market, meal prep at the community kitchen, and door-to-door distribution from 6:00 PM. Each shift serves roughly 300 hot meals cooked fresh with hygiene standards monitored by the resident community leaders.',
    category: 'Community Service',
    location: 'Korail Slum, Banani, Dhaka',
    date: new Date('2026-11-09T14:00:00+06:00'),
    volunteersNeeded: 25,
    organizerEmail: 'arif.mahmud@du.ac.bd',
    imageUrl:
      'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80',
  },
];

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

// POST /api/events/seed - insert sample volunteer events for Bangladesh
router.post('/seed', async (req, res) => {
  try {
    const events = await Event.insertMany(seedEvents);
    res.status(201).json({ message: `Seeded ${events.length} events successfully`, events });
  } catch (error) {
    res.status(500).json({ message: 'Failed to seed events', error: error.message });
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

// GET /api/events/user/:email - fetch all events created by a specific user email
router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const events = await Event.find({ organizerEmail: email.toLowerCase() }).sort({ date: 1 });
    res.status(200).json({ message: 'Events fetched successfully', events });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch events for user', error: error.message });
  }
});

// PUT /api/events/:id - update an existing event by ID
router.put('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(200).json({ message: 'Event updated successfully', event });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid event data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to update event', error: error.message });
  }
});

// DELETE /api/events/:id - delete an event by ID
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(200).json({ message: 'Event deleted successfully', event });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    res.status(500).json({ message: 'Failed to delete event', error: error.message });
  }
});

export default router;
