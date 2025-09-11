# Elite Store Backend

## Deploy Instructions

### Railway Deploy:
1. Go to railway.app
2. Login with GitHub
3. Create new project
4. Deploy from folder: dropshipping-site/server/
5. Set environment variables:
   - STRIPE_SECRET_KEY=sk_live_... (your live key)
   - STRIPE_PUBLISHABLE_KEY=pk_live_... (your live key)

### Environment Variables:
```
STRIPE_SECRET_KEY=sk_live_your_actual_live_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_publishable_key_here
```

### After Deploy:
1. Get your Railway URL (e.g., https://your-app.railway.app)
2. Update frontend script.js with new backend URL
3. Redeploy frontend

## Files to deploy:
- package.json
- server.js
- .env (with environment variables)
