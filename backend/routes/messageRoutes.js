import express from 'express';
import Message from '../models/Message.js';
import { messageLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * GET /api/messages
 * Fetch all messages (with optional room filter and pagination)
 */
router.get('/', async (req, res) => {
  try {
    const { room = 'general', limit = 100, skip = 0 } = req.query;
    
    const messages = await Message.find({ room })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();
    
    // Reverse to show oldest first
    const sortedMessages = messages.reverse();
    
    res.json({
      success: true,
      count: sortedMessages.length,
      data: sortedMessages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

/**
 * GET /api/messages/stats
 * Get message statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const totalMessages = await Message.countDocuments();
    const last24Hours = await Message.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    res.json({
      success: true,
      data: {
        totalMessages,
        last24Hours
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

/**
 * DELETE /api/messages/old
 * Manually delete messages older than 24 hours (backup to TTL index)
 */
router.delete('/old', async (req, res) => {
  try {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await Message.deleteMany({ createdAt: { $lt: cutoffTime } });
    
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} old messages`
    });
  } catch (error) {
    console.error('Error deleting old messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete old messages'
    });
  }
});

export default router;
