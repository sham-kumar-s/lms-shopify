# Vercel Deployment Checklist

## ✅ Changes Applied

### Files Created
- [x] `vercel.json` - Vercel deployment configuration
- [x] `api/server.js` - Serverless function entry point
- [x] `.vercelignore` - Deployment ignore rules
- [x] `VERCEL_DEPLOYMENT.md` - Complete deployment guide
- [x] `VERCEL_FIX_SUMMARY.md` - Technical fix details
- [x] `QUICK_START_VERCEL.md` - Quick deployment guide
- [x] `DEPLOYMENT_CHECKLIST.md` - This checklist

### Files Modified
- [x] `package.json` - Updated build scripts:
  - Removed `prisma migrate deploy` from build command
  - Added `postinstall: prisma generate` script
  - New build: `prisma generate && react-router build`

### What Was NOT Changed (As Required)
- [x] Prisma is still used (not removed)
- [x] PostgreSQL/Neon configuration unchanged
- [x] DATABASE_URL not hardcoded (uses environment variable)
- [x] Shopify React Router architecture preserved
- [x] All Prisma imports use `@prisma/client` correctly

## 🚀 Deployment Steps

### Step 1: Database Preparation
```bash
# Run migrations on production database
pnpm prisma migrate deploy
```

### Step 2: Configure Vercel

**Go to**: Vercel Dashboard → Your Project → Settings → Environment Variables

Add these variables:

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | `postgresql://...` | ✅ Yes |
| `SHOPIFY_API_KEY` | Your Shopify API key | ✅ Yes |
| `SHOPIFY_API_SECRET` | Your Shopify API secret | ✅ Yes |
| `SHOPIFY_APP_URL` | `https://your-app.vercel.app` | ✅ Yes |
| `SHOPIFY_APP_SESSION_SECRET` | 32-char secret | ✅ Yes |
| `SCOPES` | Leave empty or omit | ⚪ Optional (see note below) |
| `NODE_ENV` | `production` | ⚪ Optional |

**Generate session secret**:
```bash
openssl rand -base64 32
```

### Step 3: Deploy to Vercel

```bash
# Commit all changes
git add .
git commit -m "Fix Vercel Prisma Client generation"
git push origin main

# Vercel will automatically deploy
```

### Step 4: Verify Build Logs

Watch for these success indicators in Vercel build logs:

```
✔ Generated Prisma Client (v6.x.x) to ./node_modules/.pnpm/@prisma+client@...
✓ 323 modules transformed
build/server/index.js     XX.XX kB
✓ built in XXXms
```

### Step 5: Test Deployment

1. Visit your app: `https://your-app.vercel.app`
2. Check for errors in Vercel Function Logs
3. Test Shopify authentication flow
4. Verify database connectivity

## 🔍 Verification

### Local Build Test
```bash
# Clean build
rm -rf build node_modules/.prisma

# Install dependencies (triggers postinstall)
pnpm install

# Build for production
pnpm build

# Check for Prisma Client
ls node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client/

# Start production server locally
pnpm start
```

Expected output:
- ✅ Prisma Client generated
- ✅ Build completes without errors
- ✅ Server starts on port 3000

### Vercel Build Verification

**Build logs should show**:
1. `pnpm install --frozen-lockfile` ✅
2. `prisma generate` ✅
3. `react-router build` ✅
4. No "FUNCTION_INVOCATION_FAILED" errors ✅

**Runtime logs should show**:
- No "Cannot find module '@prisma/client'" errors ✅
- Successful database connections ✅

## ⚠️ Important Notes

### Database Migrations
- ❌ DO NOT run migrations during Vercel build
- ✅ Run migrations separately before deployment
- ✅ Use CI/CD or manual execution

### Environment Variables
- Must be set in Vercel dashboard
- Apply to Production, Preview, and Development environments as needed
- DATABASE_URL must include SSL mode for production databases

### Prisma Client Generation
- Automatically runs via `postinstall` when dependencies install
- Explicitly runs via `vercel.json` buildCommand
- Both are necessary for reliability

## 🐛 Troubleshooting

### Issue: Build Fails with "Prisma Client not generated"
**Solution**: 
- Verify `vercel.json` is committed and pushed
- Check Vercel build logs for `prisma generate` execution

### Issue: Runtime Error "Cannot find module '@prisma/client'"
**Solution**:
- Ensure `.vercelignore` doesn't exclude Prisma Client
- Verify build succeeded (check logs)
- Confirm `api/server.js` exists and is deployed

### Issue: Database Connection Errors
**Solution**:
- Verify `DATABASE_URL` is set in Vercel
- Check database accepts connections from Vercel IPs
- Ensure connection string includes `?sslmode=require`
- Run migrations: `pnpm prisma migrate deploy`

### Issue: Shopify Authentication Fails
**Solution**:
- Verify all Shopify environment variables are set
- Check `SHOPIFY_APP_URL` matches your Vercel domain
- Ensure scopes are correct

## 📊 Build Command Explanation

### What Vercel Runs
```bash
# 1. Install (from vercel.json)
pnpm install --frozen-lockfile

# 2. Postinstall (from package.json)
prisma generate

# 3. Build (from vercel.json)
pnpm prisma generate && pnpm react-router build
```

### Why This Works
- **Frozen lockfile**: Ensures reproducible builds
- **Explicit prisma generate**: Runs even if postinstall is skipped
- **No migrations**: Prevents race conditions in serverless
- **Proper routing**: All traffic goes through serverless function

## ✨ Success Criteria

Your deployment is successful when:

- [x] Vercel build completes without errors
- [x] Application loads in browser
- [x] No "FUNCTION_INVOCATION_FAILED" errors
- [x] Database queries work
- [x] Shopify authentication works
- [x] No Prisma Client errors in logs

## 📚 Additional Resources

- **Full Guide**: See `VERCEL_DEPLOYMENT.md`
- **Technical Details**: See `VERCEL_FIX_SUMMARY.md`
- **Quick Start**: See `QUICK_START_VERCEL.md`

---

**Status**: ✅ Ready for deployment
**Last Updated**: August 14, 2026
**Prisma Version**: 6.19.3
**Node Version**: >=20.19 <22 || >=22.12
**Package Manager**: pnpm 10.2.0
