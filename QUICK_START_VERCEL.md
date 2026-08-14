# Quick Start: Deploy to Vercel

## Pre-Deployment Checklist

- [ ] Database is set up (PostgreSQL/Neon)
- [ ] Run migrations: `pnpm prisma migrate deploy`
- [ ] Have Shopify API credentials ready

## 1. Configure Vercel Environment Variables

Go to your Vercel project → Settings → Environment Variables and add:

```env
# Database (REQUIRED)
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Shopify (REQUIRED)
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_APP_URL=https://your-app.vercel.app
SHOPIFY_APP_SESSION_SECRET=generate_with_openssl_rand_base64_32

# SCOPES is NOT required for this LMS app - you can omit it
# The app only accesses basic shop info and uses external databases
# SCOPES=

# Optional
NODE_ENV=production
```

## 2. Deploy

```bash
# Commit your changes
git add .
git commit -m "Fix Vercel deployment with explicit Prisma generation"
git push

# Vercel will auto-deploy
```

## 3. Verify Deployment

Check Vercel build logs for:
```
✔ Generated Prisma Client (v6.x.x)
✓ built in XXXms
```

## 4. Test Your App

Visit: `https://your-app.vercel.app`

## Troubleshooting

### Build fails
- Check DATABASE_URL is set in Vercel
- Verify `vercel.json` is committed

### Runtime error
- Ensure all environment variables are set
- Check Vercel function logs
- Verify database is accessible

### Database errors
- Run migrations: `pnpm prisma migrate deploy`
- Check DATABASE_URL format includes `?sslmode=require`

## Local Development

```bash
# Install dependencies
pnpm install

# Generate Prisma Client
pnpm prisma generate

# Run migrations (development)
pnpm prisma migrate dev

# Start dev server
pnpm dev
```

## Files Changed

- ✅ `vercel.json` - Build configuration
- ✅ `api/server.js` - Serverless function
- ✅ `package.json` - Updated scripts
- ✅ `.vercelignore` - Deployment rules

## Support

For detailed information, see:
- `VERCEL_DEPLOYMENT.md` - Complete deployment guide
- `VERCEL_FIX_SUMMARY.md` - Technical details of the fix
