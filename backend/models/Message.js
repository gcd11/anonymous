import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  room: {
    type: String,
    default: 'general',
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true // Index for efficient queries
  }
});

// Auto-delete messages older than 24 hours
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
