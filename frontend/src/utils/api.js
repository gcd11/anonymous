import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Fetch all messages from the server
 * @param {string} room - Chat room name
 * @param {number} limit - Number of messages to fetch
 * @returns {Promise} - Array of messages
 */
export const fetchMessages = async (room = 'general', limit = 100) => {
  try {
    const response = await api.get('/messages', {
      params: { room, limit }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
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
