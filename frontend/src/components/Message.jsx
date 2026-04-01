import React from 'react';
import { formatMessageDate } from '../utils/formatDate';
import './Message.css';

const Message = ({ message, isOwn }) => {
  return (
    <div className={`message-wrapper ${isOwn ? 'own' : 'other'}`}>
      {!isOwn && <div className="message-username">{message.username}</div>}
      
      <div className="message-bubble">
        <div className="message-text">{message.message}</div>
        <div className="message-time">
          {formatMessageDate(message.createdAt)}
        </div>
      </div>
    </div>
  );
};

export default Message;
