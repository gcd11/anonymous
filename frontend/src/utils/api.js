import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

console.log('🔧 [API CONFIG] API URL:', API_URL);

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

console.log('🔧 [API CONFIG] Base URL:', `${API_URL}/api`);

/**
 * Fetch all messages from the server
 * @param {string} room - Chat room name
 * @param {number} limit - Number of messages to fetch
 * @returns {Promise} - Array of messages
 */
export const fetchMessages = async (room = 'general', limit = 100) => {
  try {
    console.log('📥 [API] Fetching messages for room:', room);
    const response = await api.get('/messages', {
      params: { room, limit }
    });
    console.log('✅ [API] Messages fetched:', response.data.data.length);
    return response.data.data;
  } catch (error) {
    console.error('❌ [API] Error fetching messages:', error);
    console.error('❌ [API] Error details:', error.response || error.message);
    throw error;
  }
};

/**
 * Fetch message statistics
 * @returns {Promise} - Statistics object
 */
export const fetchStats = async () => {
  try {
    const response = await api.get('/messages/stats');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};

export default api;
