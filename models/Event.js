import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    volunteersNeeded: {
      type: Number,
      required: [true, 'Volunteers needed is required'],
      min: [1, 'Volunteers needed must be at least 1'],
    },
    organizerEmail: {
      type: String,
      required: [true, 'Organizer email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Organizer email must be valid'],
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    joinedUsers: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.models.Event || mongoose.model('Event', eventSchema);
