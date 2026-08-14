# Vercel Runtime Crash Fix - Summary

## Problem
Vercel was successfully building the Shopify LMS application but crashing at runtime with:
- HTTP 500 FUNCTION_INVOCATION_FAILED
- Error: `Cannot find module '@prisma/client'` at `file:///var/task/build/server/index.js:11`

**Root Cause**: Vercel ignores package build scripts (including Prisma's postinstall script that generates the Prisma Client), causing the runtime to fail when trying to import `@prisma/client`.

## Solution Applied

### 1. Created `vercel.json` Configuration
**Location**: `/vercel.json`

Key features:
- **Explicit build command**: `pnpm prisma generate && pnpm react-router build`
- **Frozen lockfile**: Ensures reproducible builds with `pnpm install --frozen-lockfile`
- **Serverless function configuration**: 1024MB memory, 10s timeout
- **Proper routing**: Static assets + serverless function routing

```json
{
  "buildCommand": "pnpm prisma generate && pnpm react-router build",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": null,
  "functions": {
    "api/server.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "routes": [
    {
      "src": "/build/(.*)",
      "dest": "/build/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/api/server"
    }
  ]
}
```

### 2. Created Vercel Serverless Function
**Location**: `/api/server.js`

Wraps the React Router server build for Vercel's serverless environment:

```javascript
import { createRequestHandler } from "@react-router/node";
import { build } from "../build/server/index.js";

export default createRequestHandler({ build });
```

### 3. Updated `package.json`
**Changes**:
- **Added postinstall script**: `prisma generate` (fallback for environments that respect postinstall)
- **Updated build script**: Removed `prisma migrate deploy` (migrations should not run during build)
- **New build command**: `prisma generate && react-router build`

**Before**:
```json
"build": "prisma generate && prisma migrate deploy && react-router build"
```

**After**:
```json
"build": "prisma generate && react-router build",
"postinstall": "prisma generate"
```

### 4. Created `.vercelignore`
**Location**: `/.vercelignore`

Ensures Prisma Client files are preserved during deployment:
```
# Don't ignore node_modules/@prisma/client - needed for runtime
!node_modules/@prisma/client
```

### 5. Created Documentation
**Files**:
- `VERCEL_DEPLOYMENT.md` - Comprehensive deployment guide
- `VERCEL_FIX_SUMMARY.md` - This summary document

## Why This Fix Works

1. **Explicit Generation**: The `vercel.json` buildCommand explicitly runs `prisma generate`, ensuring Prisma Client is available regardless of postinstall script behavior.

2. **Proper Function Structure**: The `api/server.js` creates a Vercel-compatible serverless function entry point.

3. **Correct Routing**: The routes configuration ensures all requests are properly handled by the serverless function while allowing static assets to be served efficiently.

4. **No Build-Time Migrations**: Removed `prisma migrate deploy` from the build script (migrations should be run separately before deployment, not during serverless builds).

## Verification

✅ Local build succeeds: `pnpm build`
✅ Prisma Client generates correctly
✅ Build output includes Prisma Client at expected location
✅ No TypeScript/build errors

## Required Vercel Environment Variables

Configure these in your Vercel project dashboard:

### Essential
```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_APP_URL=https://your-app.vercel.app
SHOPIFY_APP_SESSION_SECRET=your_32_char_secret
SCOPES=your_scopes
```

### Optional (with defaults)
```env
NODE_ENV=production
```

## Database Migrations

⚠️ **IMPORTANT**: Run migrations separately, NOT during build:

```bash
# From local machine or CI/CD
pnpm prisma migrate deploy
```

## Testing the Fix

1. **Local verification**:
   ```bash
   pnpm prisma generate
   pnpm build
   pnpm start
   ```

2. **Deploy to Vercel**:
   - Push changes to your Git repository
   - Vercel will automatically detect `vercel.json` and use the custom build command
   - Monitor the build logs to confirm `prisma generate` runs successfully
   - Verify the deployment works without runtime errors

## Changes Made

- ✅ Created `vercel.json` with explicit Prisma generation
- ✅ Created `api/server.js` serverless function
- ✅ Updated `package.json` scripts
- ✅ Created `.vercelignore`
- ✅ Added comprehensive documentation
- ✅ Verified build succeeds locally
- ✅ No changes to Prisma schema or database configuration
- ✅ No changes to PostgreSQL/Neon setup
- ✅ No hardcoded DATABASE_URL
- ✅ Preserved Shopify React Router architecture

## What Changed vs Original

| Aspect | Before | After |
|--------|--------|-------|
| Vercel config | None | `vercel.json` with explicit build command |
| Serverless function | None | `api/server.js` |
| Build script | Included migrations | No migrations (separate step) |
| Postinstall | None | `prisma generate` |
| Documentation | None | Full deployment guide |

## Next Steps

1. Commit and push all changes to your Git repository
2. Configure required environment variables in Vercel dashboard
3. Run database migrations on production database: `pnpm prisma migrate deploy`
4. Deploy to Vercel (automatic on push)
5. Verify the application loads without errors

The application should now deploy successfully to Vercel with Prisma Client properly generated and available at runtime.
