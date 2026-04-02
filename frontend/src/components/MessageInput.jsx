import React, { useState, useEffect } from 'react';
import { FiSend } from 'react-icons/fi';
import './MessageInput.css';

const MessageInput = ({ onSendMessage, typingUsers, onTyping }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const maxLength = 1000;
  
  // Handle typing indicator
  useEffect(() => {
    if (message.trim().length > 0 && !isTyping) {
      setIsTyping(true);
      onTyping(true);
    } else if (message.trim().length === 0 && isTyping) {
      setIsTyping(false);
      onTyping(false);
    }
  }, [message, isTyping, onTyping]);
  
  // Stop typing indicator after 3 seconds of no input
  useEffect(() => {
    if (isTyping) {
      const timeout = setTimeout(() => {
        setIsTyping(false);
        onTyping(false);
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [message, isTyping, onTyping]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('📝 [MessageInput] Form submitted');
    console.log('📝 [MessageInput] Message:', message);
    console.log('📝 [MessageInput] Message length:', message.length);
    console.log('📝 [MessageInput] Trimmed length:', message.trim().length);
    
    if (message.trim().length === 0) {
      console.warn('⚠️ [MessageInput] Message is empty, not sending');
      return;
    }
    if (message.length > maxLength) {
      console.warn('⚠️ [MessageInput] Message too long, not sending');
      return;
    }
    
    console.log('✅ [MessageInput] Calling onSendMessage with:', message.trim());
    onSendMessage(message.trim());
    setMessage('');
    setIsTyping(false);
    onTyping(false);
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const charCount = message.length;
  const charCountClass = charCount > maxLength * 0.9 
    ? 'error' 
    : charCount > maxLength * 0.7 
    ? 'warning' 
    : '';
  
  return (
    <div className="message-input-container">
      <div className="typing-indicator">
        {typingUsers.length > 0 && (
          <span>
            {typingUsers.length === 1 
              ? `${typingUsers[0]} is typing...` 
              : `${typingUsers.length} people are typing...`}
          </span>
        )}
      </div>
      
      <form className="message-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="message-input"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          maxLength={maxLength}
          autoFocus
        />
        
        <button 
          type="submit" 
          className="send-button"
          disabled={message.trim().length === 0 || charCount > maxLength}
          aria-label="Send message"
        >
          <FiSend />
        </button>
      </form>
      
      {charCount > 0 && (
        <div className={`char-count ${charCountClass}`}>
          {charCount}/{maxLength}
        </div>
      )}
    </div>
  );
};

export default MessageInput;
