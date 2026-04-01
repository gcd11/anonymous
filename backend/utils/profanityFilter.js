import Filter from 'bad-words';

const filter = new Filter();

/**
 * Clean message from profanity
 * @param {string} text - Message text to filter
 * @returns {string} - Cleaned message
 */
export const cleanMessage = (text) => {
  try {
    return filter.clean(text);
  } catch (error) {
    console.error('Profanity filter error:', error);
    return text;
  }
};

/**
 * Check if message contains profanity
 * @param {string} text - Message text to check
 * @returns {boolean} - True if contains profanity
 */
export const isProfane = (text) => {
  try {
    return filter.isProfane(text);
  } catch (error) {
    console.error('Profanity check error:', error);
    return false;
  }
};
