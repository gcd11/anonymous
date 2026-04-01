import Message from '../models/Message.js';
import { cleanMessage } from '../utils/profanityFilter.js';

// Store active users
const activeUsers = new Map();
const typingUsers = new Map();

/**
 * Initialize Socket.io event handlers
 * @param {Server} io - Socket.io server instance
 */
export const initializeSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);
    
    // Handle user joining
    socket.on('join', ({ username, room = 'general' }) => {
      socket.username = username;
      socket.room = room;
      socket.join(room);
      
      // Add to active users
      activeUsers.set(socket.id, { username, room, socketId: socket.id });
      
      // Broadcast user joined
      socket.to(room).emit('userJoined', {
        username,
        message: `${username} joined the chat`,
        timestamp: new Date()
      });
      
      // Send updated online count
      const onlineCount = Array.from(activeUsers.values())
        .filter(user => user.room === room).length;
      io.to(room).emit('onlineCount', onlineCount);
      
      console.log(`👤 ${username} joined room: ${room}`);
    });
    
    // Handle sending messages
    socket.on('sendMessage', async ({ username, message, room = 'general' }) => {
      try {
        // Validate input
        if (!username || !message || message.trim().length === 0) {
          socket.emit('error', { message: 'Invalid message data' });
          return;
        }
        
        if (message.length > 1000) {
          socket.emit('error', { message: 'Message too long (max 1000 characters)' });
          return;
        }
        
        // Clean message from profanity
        const cleanedMessage = cleanMessage(message.trim());
        
        // Save to database
        const newMessage = await Message.create({
          username,
          message: cleanedMessage,
          room
        });
        
        // Broadcast to all users in the room
        io.to(room).emit('receiveMessage', {
          _id: newMessage._id,
          username: newMessage.username,
          message: newMessage.message,
          room: newMessage.room,
          createdAt: newMessage.createdAt
        });
        
        console.log(`💬 Message from ${username} in ${room}: ${cleanedMessage.substring(0, 50)}...`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Handle typing indicator
    socket.on('typing', ({ username, room = 'general', isTyping }) => {
      const key = `${room}-${socket.id}`;
      
      if (isTyping) {
        typingUsers.set(key, username);
      } else {
        typingUsers.delete(key);
      }
      
      // Get all typing users in this room
      const typingInRoom = Array.from(typingUsers.entries())
        .filter(([k]) => k.startsWith(`${room}-`))
        .map(([, name]) => name);
      
      // Broadcast to others in room
      socket.to(room).emit('userTyping', {
        users: typingInRoom,
        count: typingInRoom.length
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      const user = activeUsers.get(socket.id);
      
      if (user) {
        const { username, room } = user;
        
        // Remove from active users
        activeUsers.delete(socket.id);
        
        // Remove from typing users
        typingUsers.delete(`${room}-${socket.id}`);
        
        // Broadcast user left
        socket.to(room).emit('userLeft', {
          username,
          message: `${username} left the chat`,
          timestamp: new Date()
        });
        
        // Send updated online count
        const onlineCount = Array.from(activeUsers.values())
          .filter(u => u.room === room).length;
        io.to(room).emit('onlineCount', onlineCount);
        
        console.log(`❌ ${username} disconnected from ${room}`);
      }
      
      console.log(`🔌 User disconnected: ${socket.id}`);
    });
  });
};

/**
 * Get current active users count
 * @returns {number} - Number of active users
 */
export const getActiveUsersCount = () => activeUsers.size;
