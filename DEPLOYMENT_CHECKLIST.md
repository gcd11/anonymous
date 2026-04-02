# Deployment Checklist ✅

## Code Changes (Already Done ✅)
- [x] Fixed CORS origin normalization in backend
- [x] Fixed URL normalization in frontend (API & Socket)
- [x] Added comprehensive logging throughout the app
- [x] Updated local .env files

## Render Configuration (You Need to Do This)

### Backend Service: `anonymous-sso9.onrender.com`
- [ ] Go to Environment tab
- [ ] Set `CORS_ORIGIN=https://anonymous-1-ydf7.onrender.com` (NO trailing slash!)
- [ ] Set `NODE_ENV=production`
- [ ] Set `MONGODB_URI=mongodb+srv://gopalchandradas9069487_db_user:8isIS2YWDZBP4J3c@cluster0.gp5piyl.mongodb.net/?appName=Cluster0`
- [ ] Set `RATE_LIMIT_WINDOW_MS=60000`
- [ ] Set `RATE_LIMIT_MAX_REQUESTS=100`
- [ ] Set `MESSAGE_RETENTION_HOURS=24`
- [ ] Click "Save Changes"

### Frontend Service: `anonymous-1-ydf7.onrender.com`
- [ ] Go to Environment tab
- [ ] Set `VITE_API_URL=https://anonymous-sso9.onrender.com` (NO trailing slash!)
- [ ] Set `VITE_SOCKET_URL=https://anonymous-sso9.onrender.com` (NO trailing slash!)
- [ ] Click "Save Changes"

## Deployment
- [ ] Commit changes: `git add .`
- [ ] Commit: `git commit -m "Fix CORS and add logging"`
- [ ] Push: `git push`
- [ ] Wait for Render to redeploy both services (3-5 minutes)

## Testing
- [ ] Open https://anonymous-1-ydf7.onrender.com/
- [ ] Open browser console (F12)
- [ ] Check for connection logs: `✅ [SOCKET] Connected to server`
- [ ] Try sending a message
- [ ] Verify message appears in chat
- [ ] Check backend logs on Render for message flow

## Success Indicators
✅ No CORS errors in browser console
✅ Socket connects successfully
✅ Messages send and appear in chat
✅ Online count updates
✅ Typing indicators work

## If Issues Persist
1. Share browser console logs (all messages)
2. Share Render backend logs
3. Verify environment variables are set correctly (no typos, no trailing slashes)
4. Try hard refresh (Ctrl+Shift+R)
