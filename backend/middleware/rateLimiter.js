import rateLimit from 'express-rate-limit';

// Rate limiter for API endpoints
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for message sending
export const messageLimiter = rateLimit({
  windowMs: 10000, // 10 seconds
  max: 10, // 10 messages per 10 seconds
  message: 'You are sending messages too quickly. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});
