import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Volunteer User', trim: true },
    email: { type: String, required: true, unique: true },
    image: { type: String, default: '', trim: true },
    joinedEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', userSchema);
