# Deployment Guide for Render

This guide will help you deploy both the frontend and backend of the Anonymous Chat application to Render.

## Prerequisites

1. A [Render account](https://render.com) (free tier available)
2. A [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas) for cloud database (free tier available)
3. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user with username and password
4. Whitelist all IP addresses (0.0.0.0/0) for Render access
5. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/anonymous-chat`)

## Step 2: Deploy Backend to Render

### Option A: Using Blueprint (Recommended)

1. Push your code to GitHub
2. Go to Render Dashboard
3. Click "New" → "Blueprint"
4. Connect your repository
5. Render will detect the `render.yaml` file
6. Set the following environment variables for the backend service:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `CORS_ORIGIN`: Will be your frontend URL (e.g., `https://your-app.onrender.com`)

### Option B: Manual Deployment

1. Go to Render Dashboard
2. Click "New" → "Web Service"
3. Connect your repository
4. Configure:
   - **Name**: `anonymous-chat-backend`
   - **Region**: Choose closest to you
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Add Environment Variables:
   ```
   NODE_ENV=production
   MONGODB_URI=<your-mongodb-atlas-connection-string>
   CORS_ORIGIN=<your-frontend-url>
   PORT=10000
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=100
   MESSAGE_RETENTION_HOURS=24
   ```

6. Click "Create Web Service"

## Step 3: Deploy Frontend to Render

### Option A: Using Blueprint (Recommended)

If you used Blueprint for backend, the frontend will deploy automatically. Just set:
- `VITE_API_URL`: Your backend URL (e.g., `https://anonymous-chat-backend.onrender.com`)
- `VITE_SOCKET_URL`: Same as VITE_API_URL

### Option B: Manual Deployment

1. Go to Render Dashboard
2. Click "New" → "Static Site"
3. Connect your repository
4. Configure:
   - **Name**: `anonymous-chat-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

5. Add Environment Variables:
   ```
   VITE_API_URL=<your-backend-url>
   VITE_SOCKET_URL=<your-backend-url>
   ```

6. Click "Create Static Site"

## Step 4: Update CORS Settings

After both services are deployed:

1. Go to your backend service on Render
2. Update the `CORS_ORIGIN` environment variable with your actual frontend URL
3. The backend will automatically redeploy

## Step 5: Test Your Deployment

1. Visit your frontend URL
2. Try sending messages
3. Open in multiple browser tabs to test real-time chat
4. Check the backend logs on Render for any errors

## Important Notes

### Free Tier Limitations

- Backend services on free tier spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- Static sites (frontend) don't spin down

### Custom Domain (Optional)

1. Go to your service settings on Render
2. Click "Custom Domain"
3. Add your domain and follow DNS configuration instructions

### Environment Variables

Make sure to set these correctly:
- Backend `CORS_ORIGIN` must match your frontend URL exactly
- Frontend `VITE_API_URL` and `VITE_SOCKET_URL` must match your backend URL exactly
- Don't include trailing slashes in URLs

### Monitoring

- Check logs in Render Dashboard under "Logs" tab
- Use the `/health` endpoint to monitor backend status
- Set up Render's built-in health checks

## Troubleshooting

### Backend won't connect to MongoDB
- Verify MongoDB Atlas connection string is correct
- Ensure IP whitelist includes 0.0.0.0/0
- Check database user has correct permissions

### CORS Errors
- Verify `CORS_ORIGIN` in backend matches frontend URL exactly
- Don't include trailing slashes
- Redeploy backend after changing CORS settings

### Socket.io Connection Issues
- Ensure `VITE_SOCKET_URL` matches backend URL
- Check backend logs for connection errors
- Verify WebSocket connections aren't blocked

### Frontend Not Loading
- Check build logs for errors
- Verify `dist` folder is being created
- Ensure environment variables are set before build

## Updating Your App

1. Push changes to your Git repository
2. Render will automatically detect changes and redeploy
3. You can also manually trigger deploys from the Render Dashboard

## Cost Optimization

- Free tier is sufficient for testing and small projects
- Upgrade to paid plans for:
  - No spin-down delays
  - More resources
  - Better performance
  - Custom domains with SSL

## Support

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- Check application logs on Render for debugging
