import React from 'react';
import { FiMoon, FiSun, FiUsers } from 'react-icons/fi';
import './ChatHeader.css';

const ChatHeader = ({ darkMode, toggleDarkMode, onlineCount, username }) => {
  return (
    <div className="chat-header">
      <div className="header-left">
        <h1>Anonymous Chat</h1>
        <div className="online-indicator">
          <FiUsers />
          <span>{onlineCount} online</span>
        </div>
      </div>
      
      <div className="header-right">
        <div className="username-display">
          <span className="username-label">You:</span>
          <span className="username-value">{username}</span>
        </div>
        
        <button 
          className="theme-toggle" 
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
        >
          {darkMode ? <FiSun /> : <FiMoon />}
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
