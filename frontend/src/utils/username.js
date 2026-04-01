/**
 * Generate a random username
 * @returns {string} - Random username like "User_1234"
 */
export const generateUsername = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `User_${randomNum}`;
};

/**
 * Get username from localStorage or generate new one
 * @returns {string} - Username
 */
export const getOrCreateUsername = () => {
  let username = localStorage.getItem('chatUsername');
  
  if (!username) {
    username = generateUsername();
    localStorage.setItem('chatUsername', username);
  }
  
  return username;
};

/**
 * Update username in localStorage
 * @param {string} newUsername - New username
 */
export const updateUsername = (newUsername) => {
  localStorage.setItem('chatUsername', newUsername);
};

/**
 * Clear username from localStorage
 */
export const clearUsername = () => {
  localStorage.removeItem('chatUsername');
};
