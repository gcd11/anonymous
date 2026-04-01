# Security Best Practices

## Overview

This document outlines security considerations and best practices for the anonymous chat application.

## Current Security Measures

### 1. Input Validation and Sanitization

#### Message Length Limits
- Maximum message length: 1000 characters
- Username length: 50 characters
- Prevents buffer overflow and DoS attacks

#### Profanity Filtering
```javascript
import Filter from 'bad-words';
const filter = new Filter();
const cleanedMessage = filter.clean(message);
```

### 2. Rate Limiting

#### API Rate Limiting
- 100 requests per minute per IP
- Prevents API abuse and DoS attacks

```javascript
const apiLimiter = rateLimit({
  windowMs: 60000,
  max: 100,
  message: 'Too many requests'
});
```

#### Message Rate Limiting
- 10 messages per 10 seconds per IP
- Prevents spam and flooding

### 3. CORS Configuration

```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
```

- Restricts API access to specified origins
- Prevents unauthorized cross-origin requests

### 4. Security Headers (Helmet)

```javascript
app.use(helmet());
```

Helmet sets various HTTP headers:
- X-DNS-Prefetch-Control
- X-Frame-Options
- Strict-Transport-Security
- X-Download-Options
- X-Content-Type-Options
- X-XSS-Protection

### 5. Environment Variables

- Sensitive data stored in `.env` files
- Never committed to version control
- Different configs for dev/prod

### 6. MongoDB Security

#### Connection Security
- Use MongoDB Atlas with TLS/SSL
- IP whitelist for database access
- Strong authentication credentials

#### Data Validation
```javascript
const messageSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  }
});
```

### 7. Socket.io Security

#### Connection Validation
```javascript
io.use((socket, next) => {
  // Validate connection
  const ip = socket.handshake.address;
  // Implement IP-based throttling
  next();
});
```

#### Event Validation
- Validate all incoming socket events
- Check data types and formats
- Sanitize user input

## Additional Security Recommendations

### 1. Implement Content Security Policy (CSP)

```javascript
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", process.env.SOCKET_URL]
  }
}));
```

### 2. Add Request Size Limits

```javascript
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
```

### 3. Implement IP Blocking

```javascript
const blockedIPs = new Set();

app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  if (blockedIPs.has(ip)) {
    return res.status(403).json({ 
      message: 'Access denied' 
    });
  }
  
  next();
});
```

### 4. Add Honeypot Fields

Detect bots by adding hidden form fields:

```javascript
// Backend validation
socket.on('sendMessage', ({ username, message, honeypot }) => {
  if (honeypot) {
    // Bot detected, ignore message
    return;
  }
  // Process message
});
```

### 5. Implement Message Moderation

```javascript
const moderationQueue = [];

socket.on('sendMessage', async ({ username, message }) => {
  // Check for suspicious patterns
  if (containsSuspiciousContent(message)) {
    moderationQueue.push({ username, message });
    socket.emit('messageQueued', { 
      message: 'Your message is under review' 
    });
    return;
  }
  
  // Send message normally
});
```

### 6. Add CAPTCHA for High-Risk Actions

For production, consider adding CAPTCHA:

```javascript
// Frontend
import ReCAPTCHA from "react-google-recaptcha";

<ReCAPTCHA
  sitekey="your-site-key"
  onChange={handleCaptchaChange}
/>

// Backend
const verifyCaptcha = async (token) => {
  const response = await fetch(
    `https://www.google.com/recaptcha/api/siteverify`,
    {
      method: 'POST',
      body: `secret=${process.env.RECAPTCHA_SECRET}&response=${token}`
    }
  );
  return response.json();
};
```

### 7. Implement Session Management

```javascript
import session from 'express-session';
import MongoStore from 'connect-mongo';

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
```

### 8. Add Logging and Monitoring

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'combined.log' 
    })
  ]
});

// Log suspicious activities
logger.warn('Suspicious activity detected', {
  ip: req.ip,
  username,
  action: 'rapid_messages',
  timestamp: new Date()
});
```

### 9. Implement XSS Protection

```javascript
import xss from 'xss';

// Sanitize message content
const sanitizeMessage = (message) => {
  return xss(message, {
    whiteList: {}, // No HTML allowed
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script']
  });
};

socket.on('sendMessage', ({ message }) => {
  const cleanMessage = sanitizeMessage(message);
  // Process clean message
});
```

### 10. Add SQL Injection Protection

While using MongoDB (NoSQL), still validate inputs:

```javascript
// Prevent NoSQL injection
const sanitizeInput = (input) => {
  if (typeof input === 'object') {
    return JSON.stringify(input);
  }
  return String(input).replace(/[^\w\s]/gi, '');
};
```

### 11. Implement HTTPS Only

```javascript
// Redirect HTTP to HTTPS in production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});
```

### 12. Add Dependency Security Scanning

```bash
# Install npm audit
npm audit

# Fix vulnerabilities
npm audit fix

# Use Snyk for continuous monitoring
npm install -g snyk
snyk test
snyk monitor
```

### 13. Implement Error Handling

```javascript
// Don't expose stack traces in production
app.use((err, req, res, next) => {
  logger.error(err.stack);
  
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});
```

### 14. Add Database Backup Strategy

```javascript
import { exec } from 'child_process';
import cron from 'node-cron';

// Daily backup at 2 AM
cron.schedule('0 2 * * *', () => {
  const timestamp = new Date().toISOString();
  const backupPath = `./backups/backup-${timestamp}.gz`;
  
  exec(
    `mongodump --uri="${process.env.MONGODB_URI}" --archive=${backupPath} --gzip`,
    (error, stdout, stderr) => {
      if (error) {
        logger.error('Backup failed:', error);
      } else {
        logger.info('Backup completed:', backupPath);
      }
    }
  );
});
```

## Security Checklist

### Development
- [ ] Use environment variables for sensitive data
- [ ] Never commit `.env` files
- [ ] Use strong, unique passwords
- [ ] Keep dependencies updated
- [ ] Use HTTPS in development (optional)

### Production
- [ ] Enable HTTPS/TLS
- [ ] Configure proper CORS
- [ ] Enable rate limiting
- [ ] Set up monitoring and alerts
- [ ] Implement logging
- [ ] Regular security audits
- [ ] Database backups
- [ ] Use strong authentication for database
- [ ] Whitelist IPs for database access
- [ ] Enable firewall rules
- [ ] Use environment-specific configs
- [ ] Implement DDoS protection (Cloudflare)
- [ ] Regular dependency updates
- [ ] Security headers configured
- [ ] Input validation on all endpoints
- [ ] Error handling without information leakage

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Monitor unusual activity patterns
- [ ] Track failed authentication attempts
- [ ] Monitor database performance
- [ ] Set up uptime monitoring
- [ ] Configure alerts for security events

## Incident Response Plan

### 1. Detection
- Monitor logs for suspicious activity
- Set up automated alerts
- Regular security audits

### 2. Response
- Isolate affected systems
- Block malicious IPs
- Rotate credentials if compromised
- Notify users if data breach

### 3. Recovery
- Restore from backups if needed
- Patch vulnerabilities
- Update security measures

### 4. Post-Incident
- Document the incident
- Review and improve security
- Update incident response plan

## Compliance Considerations

### GDPR (if applicable)
- Anonymous users = minimal personal data
- Implement data deletion on request
- Clear privacy policy
- Data retention policy (24 hours)

### COPPA (if allowing children)
- Age verification
- Parental consent
- Additional moderation

## Regular Security Tasks

### Daily
- Monitor error logs
- Check for unusual activity
- Review rate limit hits

### Weekly
- Review security logs
- Check for failed login attempts
- Monitor database performance

### Monthly
- Update dependencies
- Security audit
- Review access logs
- Test backup restoration

### Quarterly
- Penetration testing
- Security policy review
- Incident response drill
- Dependency security scan

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)
- [Socket.io Security](https://socket.io/docs/v4/security/)
