# Vercel Deployment Guide

## Overview

This Shopify LMS application is configured for deployment on Vercel with proper Prisma Client generation.

## Key Configuration Files

### 1. `vercel.json`
Configures the Vercel build and deployment process:
- **buildCommand**: Explicitly runs `prisma generate` before building the React Router app
- **installCommand**: Uses `pnpm install --frozen-lockfile` for reproducible builds
- **functions**: Configures the serverless function with appropriate memory and timeout
- **routes**: Routes all traffic through the serverless function, with static asset handling

### 2. `api/server.js`
Serverless function entry point that wraps the React Router server build.

### 3. `package.json`
- **build script**: `prisma generate && react-router build` (no migrations)
- **postinstall script**: `prisma generate` ensures Prisma Client is generated after dependencies install

### 4. `.vercelignore`
Ensures Prisma Client files are not ignored during deployment.

## Required Vercel Environment Variables

You must configure these environment variables in your Vercel project settings:

### Database Configuration
```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```
- Your PostgreSQL/Neon database connection string
- Must include SSL mode for production databases

### Shopify Configuration
```
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_APP_URL=https://your-app.vercel.app
```

**Note on SCOPES**: This LMS application does NOT require any Shopify API scopes as it only accesses basic shop information and stores all data in external databases (MongoDB + PostgreSQL). You can either:
- Omit the `SCOPES` variable entirely, OR
- Set it to an empty value: `SCOPES=`

### Session Encryption
```
SHOPIFY_APP_SESSION_SECRET=your_32_character_secret_key
```
- Generate using: `openssl rand -base64 32`

## Database Migrations

**IMPORTANT**: Database migrations should NOT run during the Vercel build process.

### Running Migrations

1. **Before first deployment**, run migrations from your local machine:
   ```bash
   pnpm prisma migrate deploy
   ```

2. **For subsequent schema changes**:
   ```bash
   # Create migration locally
   pnpm prisma migrate dev --name your_migration_name
   
   # Deploy to production database
   pnpm prisma migrate deploy
   ```

3. **Alternative**: Use a CI/CD pipeline or Vercel's deploy hooks to run migrations before deployment.

## Deployment Steps

### Initial Setup

1. **Connect your Git repository** to Vercel

2. **Configure build settings**:
   - Framework Preset: Other
   - Build Command: (leave empty - uses vercel.json)
   - Install Command: (leave empty - uses vercel.json)
   - Output Directory: (leave empty - uses vercel.json)

3. **Add environment variables** (see section above)

4. **Deploy**: Vercel will automatically build and deploy

### Troubleshooting

#### "PrismaClient is not configured" Error
- Verify `DATABASE_URL` is set in Vercel environment variables
- Check that the database is accessible from Vercel's IP ranges
- Ensure migrations have been run on the production database

#### "Cannot find module '@prisma/client'" Error
- This should not occur with the current setup
- If it does, verify `prisma generate` runs in the build command
- Check Vercel build logs for any errors during Prisma generation

#### Function Timeout Errors
- Increase `maxDuration` in `vercel.json` functions configuration
- Consider upgrading to Vercel Pro for longer timeout limits

## Local Testing

Test the production build locally:

```bash
# Generate Prisma Client
pnpm prisma generate

# Build for production
pnpm build

# Start production server
pnpm start
```

Access at: `http://localhost:3000`

## Verification Checklist

- [ ] Prisma Client generates successfully during build
- [ ] Environment variables are configured in Vercel
- [ ] Database migrations are applied to production database
- [ ] Application builds without errors
- [ ] Serverless function deploys successfully
- [ ] Application loads in browser
- [ ] Database connections work in production

## Package Manager

This project uses **pnpm**. Ensure your Vercel project is configured to use pnpm:
- Vercel automatically detects pnpm via `package.json` packageManager field
- The `pnpm-lock.yaml` file must be committed to version control

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [React Router on Vercel](https://reactrouter.com/en/main/guides/deployment#vercel)
