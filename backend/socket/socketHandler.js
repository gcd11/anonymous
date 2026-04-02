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
  console.log('🔧 [SOCKET HANDLER] Initializing socket handlers');
  
  io.on('connection', (socket) => {
    console.log(`✅ [SOCKET HANDLER] User connected: ${socket.id}`);
    
    // Handle user joining
    socket.on('join', ({ username, room = 'general' }) => {
      console.log(`📥 [SOCKET HANDLER] Join event received:`, { username, room, socketId: socket.id });
      
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
      
      console.log(`👤 [SOCKET HANDLER] ${username} joined room: ${room}, Online count: ${onlineCount}`);
    });
    
    // Handle sending messages
    socket.on('sendMessage', async ({ username, message, room = 'general' }) => {
      console.log(`📥 [SOCKET HANDLER] sendMessage event received from ${socket.id}`);
      console.log(`📥 [SOCKET HANDLER] Data:`, { username, message, room });
      
      try {
        // Validate input
        if (!username || !message || message.trim().length === 0) {
          console.error('❌ [SOCKET HANDLER] Invalid message data:', { username, message, room });
          socket.emit('error', { message: 'Invalid message data' });
          return;
        }
        
        if (message.length > 1000) {
          console.error('❌ [SOCKET HANDLER] Message too long:', message.length);
          socket.emit('error', { message: 'Message too long (max 1000 characters)' });
          return;
        }
        
        console.log('🧹 [SOCKET HANDLER] Cleaning message...');
        // Clean message from profanity
        const cleanedMessage = cleanMessage(message.trim());
        console.log('✅ [SOCKET HANDLER] Message cleaned:', cleanedMessage);
        
        console.log('💾 [SOCKET HANDLER] Saving to database...');
        // Save to database
        const newMessage = await Message.create({
          username,
          message: cleanedMessage,
          room
        });
        console.log('✅ [SOCKET HANDLER] Message saved to DB:', newMessage._id);
        
        const messageToEmit = {
          _id: newMessage._id,
          username: newMessage.username,
          message: newMessage.message,
          room: newMessage.room,
          createdAt: newMessage.createdAt
        };
        
        console.log('📤 [SOCKET HANDLER] Broadcasting message to room:', room);
        console.log('📤 [SOCKET HANDLER] Message data:', messageToEmit);
        
        // Broadcast to all users in the room
        io.to(room).emit('receiveMessage', messageToEmit);
        
        console.log(`✅ [SOCKET HANDLER] Message from ${username} in ${room}: ${cleanedMessage.substring(0, 50)}...`);
      } catch (error) {
        console.error('❌ [SOCKET HANDLER] Error sending message:', error);
        console.error('❌ [SOCKET HANDLER] Error stack:', error.stack);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Handle typing indicator
    socket.on('typing', ({ username, room = 'general', isTyping }) => {
      console.log(`⌨️ [SOCKET HANDLER] Typing event:`, { username, room, isTyping, socketId: socket.id });
      
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
      
      console.log(`⌨️ [SOCKET HANDLER] Broadcasting typing users to room ${room}:`, typingInRoom);
      
      // Broadcast to others in room
      socket.to(room).emit('userTyping', {
        users: typingInRoom,
        count: typingInRoom.length
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 [SOCKET HANDLER] User disconnecting: ${socket.id}`);
      
      const user = activeUsers.get(socket.id);
      
      if (user) {
        const { username, room } = user;
        
        console.log(`👋 [SOCKET HANDLER] User ${username} leaving room ${room}`);
        
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
        
        console.log(`❌ [SOCKET HANDLER] ${username} disconnected from ${room}, Online count: ${onlineCount}`);
      }
      
      console.log(`🔌 [SOCKET HANDLER] User disconnected: ${socket.id}`);
    });
  });
};

/**
 * Get current active users count
 * @returns {number} - Number of active users
 */
export const getActiveUsersCount = () => activeUsers.size;
