# Scaling Guide

## Overview

This guide covers strategies for scaling the anonymous chat application to handle thousands of concurrent users.

## Current Architecture Limitations

- Single server instance
- In-memory user tracking
- No horizontal scaling support
- Limited to single server's connection capacity (~10k concurrent connections)

## Scaling Strategies

### 1. Socket.io with Redis Adapter

For horizontal scaling across multiple server instances, implement Redis as a message broker.

#### Install Redis Adapter

```bash
cd backend
npm install @socket.io/redis-adapter redis
```

#### Update server.js

```javascript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

// Create Redis clients
const pubClient = createClient({ 
  url: process.env.REDIS_URL || 'redis://localhost:6379' 
});
const subClient = pubClient.duplicate();

// Connect Redis clients
await Promise.all([pubClient.connect(), subClient.connect()]);

// Attach Redis adapter to Socket.io
io.adapter(createAdapter(pubClient, subClient));
```

#### Benefits
- Multiple server instances can share Socket.io events
- Load balancer can distribute connections
- Horizontal scaling capability
- Session persistence across servers

#### Redis Hosting Options
- **Redis Cloud** (managed, free tier available)
- **AWS ElastiCache** (production-grade)
- **DigitalOcean Managed Redis**
- **Self-hosted Redis** (Docker/EC2)

### 2. Load Balancing

#### Nginx Configuration

```nginx
upstream chat_backend {
    ip_hash;  # Sticky sessions for Socket.io
    server backend1.example.com:5000;
    server backend2.example.com:5000;
    server backend3.example.com:5000;
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://chat_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### AWS Application Load Balancer
- Enable sticky sessions (target group attributes)
- Configure health checks
- Enable WebSocket support
- Use multiple availability zones

### 3. Database Optimization

#### MongoDB Indexing

```javascript
// Add compound index for efficient queries
messageSchema.index({ room: 1, createdAt: -1 });

// Add text index for search functionality
messageSchema.index({ message: 'text' });
```

#### MongoDB Sharding

For very large datasets (millions of messages):

```javascript
// Enable sharding on database
sh.enableSharding("anonymous-chat")

// Shard messages collection by room
sh.shardCollection("anonymous-chat.messages", { room: 1, createdAt: 1 })
```

#### Read Replicas

```javascript
// Configure read preference for scaling reads
mongoose.connect(process.env.MONGODB_URI, {
  readPreference: 'secondaryPreferred'
});
```

#### Message Pagination

```javascript
// Implement cursor-based pagination
router.get('/messages', async (req, res) => {
  const { room = 'general', limit = 50, cursor } = req.query;
  
  const query = { room };
  if (cursor) {
    query.createdAt = { $lt: new Date(cursor) };
  }
  
  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .lean();
  
  res.json({
    data: messages.reverse(),
    nextCursor: messages.length > 0 
      ? messages[0].createdAt 
      : null
  });
});
```

### 4. Caching Strategy

#### Redis Caching

```javascript
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

// Cache recent messages
router.get('/messages', async (req, res) => {
  const { room = 'general' } = req.query;
  const cacheKey = `messages:${room}:recent`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  // Fetch from database
  const messages = await Message.find({ room })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  
  // Cache for 1 minute
  await redis.setEx(cacheKey, 60, JSON.stringify(messages));
  
  res.json(messages);
});
```

### 5. CDN for Static Assets

- Use Cloudflare, AWS CloudFront, or Vercel Edge Network
- Cache static assets (JS, CSS, images)
- Reduce server load
- Improve global latency

### 6. Message Batching

For high-traffic scenarios, batch messages to reduce database writes:

```javascript
let messageQueue = [];
let batchTimeout = null;

const batchInsertMessages = async () => {
  if (messageQueue.length === 0) return;
  
  const batch = [...messageQueue];
  messageQueue = [];
  
  try {
    await Message.insertMany(batch);
    console.log(`Inserted ${batch.length} messages`);
  } catch (error) {
    console.error('Batch insert error:', error);
  }
};

socket.on('sendMessage', async ({ username, message, room }) => {
  // Add to queue
  messageQueue.push({ username, message, room, createdAt: new Date() });
  
  // Broadcast immediately
  io.to(room).emit('receiveMessage', {
    username,
    message,
    room,
    createdAt: new Date()
  });
  
  // Batch insert every 100ms or 10 messages
  if (messageQueue.length >= 10) {
    clearTimeout(batchTimeout);
    await batchInsertMessages();
  } else {
    clearTimeout(batchTimeout);
    batchTimeout = setTimeout(batchInsertMessages, 100);
  }
});
```

### 7. Rate Limiting at Scale

#### Redis-based Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

const limiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:'
  }),
  windowMs: 60000,
  max: 100
});

app.use('/api/', limiter);
```

### 8. Monitoring and Observability

#### Application Monitoring

```javascript
// Add Prometheus metrics
import promClient from 'prom-client';

const register = new promClient.Registry();

const messageCounter = new promClient.Counter({
  name: 'chat_messages_total',
  help: 'Total number of messages sent',
  registers: [register]
});

const activeConnections = new promClient.Gauge({
  name: 'chat_active_connections',
  help: 'Number of active Socket.io connections',
  registers: [register]
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

#### Logging

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Use structured logging
logger.info('Message sent', {
  username,
  room,
  messageLength: message.length,
  timestamp: new Date()
});
```

### 9. WebSocket Connection Optimization

```javascript
// Increase connection limits
const io = new Server(httpServer, {
  cors: { /* ... */ },
  maxHttpBufferSize: 1e6, // 1MB
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowUpgrades: true
});

// Implement connection throttling
const connectionLimiter = new Map();

io.use((socket, next) => {
  const ip = socket.handshake.address;
  const now = Date.now();
  const connections = connectionLimiter.get(ip) || [];
  
  // Remove old connections
  const recent = connections.filter(time => now - time < 60000);
  
  if (recent.length >= 5) {
    return next(new Error('Too many connections'));
  }
  
  recent.push(now);
  connectionLimiter.set(ip, recent);
  next();
});
```

### 10. Database Connection Pooling

```javascript
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 50, // Increase pool size
  minPoolSize: 10,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  family: 4 // Use IPv4
});
```

## Performance Benchmarks

### Target Metrics
- **Response Time**: < 100ms for API calls
- **Message Latency**: < 50ms for real-time messages
- **Concurrent Users**: 10,000+ per server instance
- **Messages per Second**: 1,000+ per server instance
- **Database Queries**: < 10ms average

### Load Testing

```bash
# Install Artillery
npm install -g artillery

# Create load test config
cat > load-test.yml << EOF
config:
  target: "http://localhost:5000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
scenarios:
  - engine: socketio
    flow:
      - emit:
          channel: "join"
          data:
            username: "User_{{ \$randomNumber() }}"
            room: "general"
      - think: 2
      - emit:
          channel: "sendMessage"
          data:
            username: "User_{{ \$randomNumber() }}"
            message: "Test message"
            room: "general"
EOF

# Run load test
artillery run load-test.yml
```

## Cost Optimization

### Infrastructure Costs (Estimated Monthly)

**Small Scale (< 1,000 users)**
- Backend: Render Free Tier or AWS t3.micro ($10)
- Database: MongoDB Atlas Free Tier
- Frontend: Vercel Free Tier
- Total: $0-10/month

**Medium Scale (1,000-10,000 users)**
- Backend: 2x AWS t3.small ($30)
- Database: MongoDB Atlas M10 ($57)
- Redis: Redis Cloud 1GB ($10)
- Frontend: Vercel Pro ($20)
- Load Balancer: AWS ALB ($20)
- Total: ~$137/month

**Large Scale (10,000-100,000 users)**
- Backend: 5x AWS t3.medium ($200)
- Database: MongoDB Atlas M30 ($300)
- Redis: Redis Cloud 5GB ($50)
- Frontend: Vercel Pro + Edge ($50)
- Load Balancer: AWS ALB ($50)
- CDN: CloudFront ($50)
- Total: ~$700/month

## Deployment Architecture

```
                    ┌─────────────┐
                    │   Cloudflare│
                    │     CDN     │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Vercel    │
                    │  (Frontend) │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │     AWS     │
                    │     ALB     │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │Backend 1│       │Backend 2│       │Backend 3│
   │  (EC2)  │       │  (EC2)  │       │  (EC2)  │
   └────┬────┘       └────┬────┘       └────┬────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────▼──────┐
                    │    Redis    │
                    │   Cluster   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  MongoDB    │
                    │   Atlas     │
                    │  (Replica)  │
                    └─────────────┘
```

## Conclusion

Scaling a real-time chat application requires:
1. Horizontal scaling with Redis adapter
2. Load balancing with sticky sessions
3. Database optimization and sharding
4. Caching strategy
5. Monitoring and observability
6. Connection pooling and rate limiting

Start with the basics and scale incrementally based on actual usage patterns and metrics.
