# Setup Instructions

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account (or local MongoDB)
- Git

## Step-by-Step Setup

### 1. Clone or Download the Project

```bash
# If using git
git clone <repository-url>
cd anonymous-chat

# Or download and extract the ZIP file
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### 3. Configure MongoDB

#### Option A: MongoDB Atlas (Recommended for Production)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and cluster
3. Click "Connect" on your cluster
4. Choose "Connect your application"
5. Copy the connection string
6. Update `backend/.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/anonymous-chat?retryWrites=true&w=majority
```

Replace `username`, `password`, and `cluster` with your actual values.

#### Option B: Local MongoDB

```env
MONGODB_URI=mongodb://localhost:27017/anonymous-chat
```

### 4. Configure Backend Environment Variables

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
MESSAGE_RETENTION_HOURS=24
```

### 5. Start Backend Server

```bash
# From backend directory
npm run dev

# You should see:
# ✅ MongoDB Connected: cluster.mongodb.net
# 🚀 Server running on port 5000
# 📡 Socket.io server ready
```

### 6. Frontend Setup

Open a new terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### 7. Configure Frontend Environment Variables

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### 8. Start Frontend Development Server

```bash
# From frontend directory
npm run dev

# You should see:
# VITE v5.0.8  ready in 500 ms
# ➜  Local:   http://localhost:5173/
```

### 9. Test the Application

1. Open your browser and go to `http://localhost:5173`
2. You should see the chat interface
3. Open another browser window/tab (or incognito mode)
4. Both windows should be able to chat in real-time

## Troubleshooting

### Backend Issues

**MongoDB Connection Failed**
- Verify your MongoDB URI is correct
- Check if your IP is whitelisted in MongoDB Atlas
- Ensure MongoDB service is running (if using local)

**Port Already in Use**
- Change PORT in `backend/.env` to another port (e.g., 5001)
- Update VITE_API_URL and VITE_SOCKET_URL in `frontend/.env`

**Socket.io Connection Failed**
- Check if backend server is running
- Verify CORS_ORIGIN matches your frontend URL
- Check firewall settings

### Frontend Issues

**Cannot Connect to Backend**
- Verify backend server is running on correct port
- Check VITE_API_URL and VITE_SOCKET_URL in `.env`
- Clear browser cache and reload

**Messages Not Appearing**
- Check browser console for errors
- Verify Socket.io connection status
- Check network tab for failed requests

## Production Deployment

### Backend Deployment (Render)

1. Create account on [Render](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Name: `anonymous-chat-backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Root Directory: `backend`
5. Add environment variables:
   - `MONGODB_URI`
   - `NODE_ENV=production`
   - `CORS_ORIGIN=https://your-frontend-url.vercel.app`
6. Deploy

### Backend Deployment (AWS EC2)

```bash
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Clone repository
git clone <repository-url>
cd anonymous-chat/backend

# Install dependencies
npm install

# Install PM2 for process management
sudo npm install -g pm2

# Create .env file with production values
nano .env

# Start application with PM2
pm2 start server.js --name "chat-backend"
pm2 startup
pm2 save

# Configure nginx as reverse proxy (optional)
sudo yum install nginx
# Configure nginx to proxy to localhost:5000
```

### Frontend Deployment (Vercel)

1. Create account on [Vercel](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add environment variables:
   - `VITE_API_URL=https://your-backend-url.onrender.com`
   - `VITE_SOCKET_URL=https://your-backend-url.onrender.com`
6. Deploy

### Frontend Deployment (Netlify)

1. Create account on [Netlify](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Configure:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
5. Add environment variables in Site settings
6. Deploy

## Post-Deployment

1. Update CORS_ORIGIN in backend to match frontend URL
2. Test all features in production
3. Monitor logs for errors
4. Set up SSL certificates (automatic on Vercel/Netlify/Render)
5. Configure custom domain (optional)

## Monitoring

### Backend Logs

```bash
# Local development
npm run dev

# Production (PM2)
pm2 logs chat-backend

# Render
Check logs in Render dashboard
```

### Database Monitoring

- MongoDB Atlas: Use built-in monitoring dashboard
- Check connection count, operations, and storage

## Maintenance

### Update Dependencies

```bash
# Backend
cd backend
npm update

# Frontend
cd frontend
npm update
```

### Database Cleanup

Messages older than 24 hours are automatically deleted via MongoDB TTL index.

Manual cleanup:
```bash
curl -X DELETE http://localhost:5000/api/messages/old
```

## Security Checklist

- [ ] Environment variables are not committed to Git
- [ ] MongoDB credentials are secure
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] HTTPS is enabled in production
- [ ] Dependencies are up to date
- [ ] Input validation is working
- [ ] Profanity filter is active

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console and server logs
3. Verify all environment variables are correct
4. Test with a fresh browser session
