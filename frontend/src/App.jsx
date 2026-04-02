import React, { useState, useEffect, useCallback } from 'react';
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import socket from './utils/socket';
import { getOrCreateUsername } from './utils/username';
import { fetchMessages } from './utils/api';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [username] = useState(getOrCreateUsername());
  const [onlineCount, setOnlineCount] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [typingUsers, setTypingUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [room] = useState('general');
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newMode));
      return newMode;
    });
  };
  
  // Apply dark mode class to body
  useEffect(() => {
    document.body.className = darkMode ? 'dark' : 'light';
  }, [darkMode]);
  
  // Load old messages on mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const oldMessages = await fetchMessages(room);
        setMessages(oldMessages);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };
    
    loadMessages();
  }, [room]);
  
  // Socket connection and event handlers
  useEffect(() => {
    console.log('🚀 [APP] Initializing socket connection...');
    console.log('🚀 [APP] Username:', username);
    console.log('🚀 [APP] Room:', room);
    
    // Connect to socket
    socket.connect();
    
    // Connection handlers
    socket.on('connect', () => {
      console.log('✅ [APP] Connected to server');
      setIsConnected(true);
      console.log('📤 [APP] Emitting join event with:', { username, room });
      socket.emit('join', { username, room });
    });
    
    socket.on('disconnect', () => {
      console.log('❌ [APP] Disconnected from server');
      setIsConnected(false);
    });
    
    // Message handlers
    socket.on('receiveMessage', (message) => {
      console.log('📨 [APP] Received message:', message);
      setMessages(prev => [...prev, message]);
    });
    
    // User join/leave handlers
    socket.on('userJoined', (data) => {
      console.log('👋 [APP] User joined:', data.message);
    });
    
    socket.on('userLeft', (data) => {
      console.log('👋 [APP] User left:', data.message);
    });
    
    // Online count handler
    socket.on('onlineCount', (count) => {
      console.log('👥 [APP] Online count updated:', count);
      setOnlineCount(count);
    });
    
    // Typing indicator handler
    socket.on('userTyping', ({ users }) => {
      console.log('⌨️ [APP] Users typing:', users);
      setTypingUsers(users.filter(u => u !== username));
    });
    
    // Error handler
    socket.on('error', (error) => {
      console.error('❌ [APP] Socket error:', error);
      alert(error.message || 'An error occurred');
    });
    
    // Cleanup on unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('receiveMessage');
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('onlineCount');
      socket.off('userTyping');
      socket.off('error');
      socket.disconnect();
    };
  }, [username, room]);
  
  // Send message handler
  const handleSendMessage = useCallback((message) => {
    console.log('📤 [APP] handleSendMessage called');
    console.log('📤 [APP] Message:', message);
    console.log('📤 [APP] Is connected:', isConnected);
    console.log('📤 [APP] Socket connected:', socket.connected);
    
    if (!isConnected) {
      console.error('❌ [APP] Cannot send message - not connected to server');
      alert('Not connected to server. Please wait...');
      return;
    }
    
    const messageData = {
      username,
      message,
      room
    };
    
    console.log('📤 [APP] Emitting sendMessage event with data:', messageData);
    socket.emit('sendMessage', messageData);
    console.log('✅ [APP] sendMessage event emitted');
  }, [username, room, isConnected]);
  
  // Typing handler
  const handleTyping = useCallback((isTyping) => {
    console.log('⌨️ [APP] Typing event:', isTyping);
    socket.emit('typing', {
      username,
      room,
      isTyping
    });
  }, [username, room]);
  
  return (
    <div className="app">
      <ChatHeader
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onlineCount={onlineCount}
        username={username}
      />
      
      <MessageList
        messages={messages}
        currentUsername={username}
      />
      
      <MessageInput
        onSendMessage={handleSendMessage}
        typingUsers={typingUsers}
        onTyping={handleTyping}
      />
      
      {!isConnected && (
        <div className="connection-status">
          Connecting to server...
        </div>
      )}
    </div>
  );
}

export default App;
