import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000').replace(/\/$/, '');

console.log('🔧 [SOCKET CONFIG] Initializing socket with URL:', SOCKET_URL);

// Initialize socket connection
const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

// Add connection event logging
socket.on('connect', () => {
  console.log('✅ [SOCKET] Connected to server, Socket ID:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('❌ [SOCKET] Connection error:', error.message);
  console.error('❌ [SOCKET] Error details:', error);
});

socket.on('disconnect', (reason) => {
  console.warn('⚠️ [SOCKET] Disconnected. Reason:', reason);
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('🔄 [SOCKET] Reconnection attempt:', attemptNumber);
});

socket.on('reconnect', (attemptNumber) => {
  console.log('✅ [SOCKET] Reconnected after', attemptNumber, 'attempts');
});

socket.on('reconnect_failed', () => {
  console.error('❌ [SOCKET] Reconnection failed after all attempts');
});

export default socket;
