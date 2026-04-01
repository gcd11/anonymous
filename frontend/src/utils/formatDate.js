import { format, isToday, isYesterday } from 'date-fns';

/**
 * Format date for message display
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatMessageDate = (date) => {
  const messageDate = new Date(date);
  
  if (isToday(messageDate)) {
    return format(messageDate, 'HH:mm');
  } else if (isYesterday(messageDate)) {
    return `Yesterday ${format(messageDate, 'HH:mm')}`;
  } else {
    return format(messageDate, 'MMM dd, HH:mm');
  }
};
