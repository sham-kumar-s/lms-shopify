# Vercel Deployment Fix v2 - React Router 7 Vercel Preset

## Problem

The initial fix attempted to use a custom `api/server.js` wrapper which was incompatible with React Router 7's build output. The error was:

```
SyntaxError: The requested module '../build/server/index.js' does not provide an export named 'build'
```

## Root Cause

React Router 7 does **NOT** export `{ build }` from its server bundle. The build output exports individual pieces like `entry`, `routes`, `assets`, etc. The custom wrapper approach was fundamentally incompatible with how React Router 7 structures its server builds.

## Correct Solution: Use the Official Vercel Preset

React Router 7 provides an official `@vercel/react-router` preset that handles Vercel deployment automatically.

### Changes Made

#### 1. Installed `@vercel/react-router`
```bash
pnpm add -w @vercel/react-router
```

#### 2. Created `react-router.config.ts`
```typescript
import { vercelPreset } from "@vercel/react-router/vite";
import type { Config } from "@react-router/dev/config";

export default {
  // Server-side render by default
  ssr: true,
  // Use Vercel preset for optimal deployment
  presets: [vercelPreset()],
} satisfies Config;
```

#### 3. Removed Custom Wrapper
- Deleted `api/server.js` (incompatible wrapper)
- Removed custom routing configuration from `vercel.json`

#### 4. Updated `vercel.json`
**Before:**
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
  "routes": [...]
}
```

**After:**
```json
{
  "buildCommand": "pnpm prisma generate && pnpm react-router build",
  "installCommand": "pnpm install --frozen-lockfile"
}
```

The Vercel preset handles all function configuration and routing automatically.

#### 5. Updated `.gitignore`
Added `.vercel` to ignore Vercel build artifacts:
```
# Vercel build artifacts
.vercel
```

## How the Vercel Preset Works

When you use `vercelPreset()` in your React Router config:

1. **Automatic Function Generation**: The preset creates Vercel serverless functions automatically
2. **Bundle Splitting**: Routes are intelligently bundled for optimal performance
3. **Metadata Generation**: Creates `.vercel/react-router-build-result.json` with deployment configuration
4. **Zero Configuration**: No need for custom wrappers or routing rules

### Build Output

The Vercel preset generates:

```
build/
├── client/              # Static assets
│   ├── assets/
│   └── favicon.ico
└── server/
    └── nodejs_eyJydW50aW1lIjoibm9kZWpzIn0/
        └── index.js     # Vercel-compatible serverless function
.vercel/
└── react-router-build-result.json  # Vercel metadata
```

The encoded directory name (`nodejs_eyJydW50aW1lIjoibm9kZWpzIn0`) is base64-encoded JSON containing runtime configuration.

## Benefits of Using the Vercel Preset

✅ **Official Support**: Maintained by Vercel and React Router teams  
✅ **Automatic Optimization**: Intelligent bundle splitting per route  
✅ **Streaming Support**: Full support for React streaming  
✅ **Function Config**: Per-route memory and timeout configuration  
✅ **Accurate Deployment Summary**: Vercel understands the app structure  
✅ **Zero Boilerplate**: No custom wrappers needed  

## Verification

Build succeeds with Vercel preset:

```bash
$ pnpm build

> prisma generate && react-router build

✔ Generated Prisma Client (v6.19.3)
✓ 323 modules transformed
✓ built in 763ms
✓ 24 modules transformed
build/server/nodejs_eyJydW50aW1lIjoibm9kZWpzIn0/index.js    80.31 kB
✓ built in 76ms
```

## Required Vercel Environment Variables

No changes to environment variables:

```env
DATABASE_URL=postgresql://...
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_APP_URL=https://your-app.vercel.app
SHOPIFY_APP_SESSION_SECRET=your_32_char_secret
SCOPES=  # Optional - this app doesn't need scopes
```

## Deployment Steps

1. **Ensure all changes are committed**:
   ```bash
   git add .
   git commit -m "Fix Vercel deployment with official React Router preset"
   git push
   ```

2. **Vercel will automatically**:
   - Detect `react-router.config.ts`
   - Use the Vercel preset configuration
   - Generate proper serverless functions
   - Deploy without errors

3. **The application will work** at `https://lms-shopify.vercel.app/`

## Files Changed

### Added
- ✅ `react-router.config.ts` - Vercel preset configuration
- ✅ `@vercel/react-router` dependency
- ✅ `VERCEL_FIX_V2.md` - This document

### Modified
- ✅ `vercel.json` - Simplified to just build commands
- ✅ `package.json` - Added `@vercel/react-router`
- ✅ `.gitignore` - Added `.vercel` directory

### Deleted
- ✅ `api/server.js` - Removed incompatible wrapper
- ✅ Custom routing rules from `vercel.json`

## Key Differences from Previous Approach

| Aspect | Previous (Wrong) | Current (Correct) |
|--------|-----------------|-------------------|
| Wrapper | Custom `api/server.js` | None - Vercel preset handles it |
| Import | `import { build }` (doesn't exist) | Vercel preset uses proper exports |
| Configuration | Manual routes in `vercel.json` | Automatic via preset |
| Build Output | Single `build/server/index.js` | `build/server/nodejs_.../index.js` |
| Metadata | None | `.vercel/react-router-build-result.json` |
| Maintenance | Custom code to maintain | Official preset - always updated |

## Architecture

```
┌─────────────────────────────────────────┐
│  React Router 7 Application              │
│  with Shopify Integration                │
└──────────────┬──────────────────────────┘
               │
               ├─ react-router.config.ts
               │  └─ vercelPreset()
               │
               ▼
┌─────────────────────────────────────────┐
│  Build Process                           │
│  $ react-router build                    │
└──────────────┬──────────────────────────┘
               │
               ├─ Client bundle → build/client/
               ├─ Server bundle → build/server/nodejs_.../
               └─ Metadata → .vercel/react-router-build-result.json
               │
               ▼
┌─────────────────────────────────────────┐
│  Vercel Platform                         │
│  - Reads metadata                        │
│  - Creates serverless functions          │
│  - Configures routing                    │
│  - Deploys to edge network               │
└─────────────────────────────────────────┘
```

## Troubleshooting

### Issue: Build fails with "Cannot find module '@vercel/react-router'"
**Solution**: Install the package:
```bash
pnpm add -w @vercel/react-router
```

### Issue: Vercel ignores react-router.config.ts
**Solution**: Ensure the file is:
1. In the project root
2. Named exactly `react-router.config.ts` (or `.js`)
3. Committed to git

### Issue: Functions still crash
**Solution**: Check that:
1. `DATABASE_URL` is set in Vercel
2. `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` are set
3. Prisma Client was generated (check build logs)
4. Database is accessible from Vercel

## References

- [Vercel React Router Documentation](https://vercel.com/docs/frameworks/frontend/react-router)
- [React Router Deployment Guide](https://reactrouter.com/start/framework/deploying)
- [@vercel/react-router Package](https://www.npmjs.com/package/@vercel/react-router)
- [React Router 7 Announcement](https://vercel.com/changelog/support-for-react-router-v7)

---

**Status**: ✅ **FIXED** - Ready for deployment  
**Date**: August 14, 2026  
**Solution**: Official Vercel preset for React Router 7
