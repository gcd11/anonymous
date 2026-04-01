import React, { useEffect, useRef } from 'react';
import Message from './Message';
import './MessageList.css';

const MessageList = ({ messages, currentUsername }) => {
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <div className="message-list">
      {messages.length === 0 ? (
        <div className="empty-state">
          <p>No messages yet. Be the first to say hello! 👋</p>
        </div>
      ) : (
        messages.map((msg) => (
          <Message
            key={msg._id}
            message={msg}
            isOwn={msg.username === currentUsername}
          />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
