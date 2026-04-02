# Render Environment Variables Setup

## Backend Service Environment Variables

Go to your backend service on Render dashboard (`https://anonymous-sso9.onrender.com`) and set these environment variables:

```
MONGODB_URI=mongodb+srv://gopalchandradas9069487_db_user:8isIS2YWDZBP4J3c@cluster0.gp5piyl.mongodb.net/?appName=Cluster0
NODE_ENV=production
CORS_ORIGIN=https://anonymous-1-ydf7.onrender.com
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
MESSAGE_RETENTION_HOURS=24
```

**IMPORTANT:** Make sure `CORS_ORIGIN` does NOT have a trailing slash!

## Frontend Service Environment Variables

Go to your frontend service on Render dashboard (`https://anonymous-1-ydf7.onrender.com`) and set these environment variables:

```
VITE_API_URL=https://anonymous-sso9.onrender.com
VITE_SOCKET_URL=https://anonymous-sso9.onrender.com
```

**IMPORTANT:** Make sure these URLs do NOT have trailing slashes!

## Steps to Set Environment Variables on Render:

1. Go to https://dashboard.render.com/
2. Click on your service (backend or frontend)
3. Go to "Environment" tab in the left sidebar
4. Click "Add Environment Variable"
5. Add each variable with its key and value
6. Click "Save Changes"
7. Render will automatically redeploy your service

## After Setting Variables:

1. Wait for both services to redeploy (this may take a few minutes)
2. Check the logs to verify the CORS origin is correct
3. Open your frontend URL and check the browser console
4. Try sending a message

## Troubleshooting:

If you still see CORS errors:
- Verify the CORS_ORIGIN has NO trailing slash
- Check the backend logs to see what CORS origin is being used
- Make sure both services have redeployed after setting the variables
- Clear your browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
