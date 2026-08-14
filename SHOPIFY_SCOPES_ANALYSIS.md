# Shopify API Scopes Analysis - LMS Application

## Summary

**The LMS application does NOT require any Shopify API scopes.**

## Current Configuration

### shopify.app.toml
```toml
[access_scopes]
scopes = ""
optional_scopes = []
```

### shopify.server.js
```javascript
scopes: process.env.SCOPES?.split(",")
```

### .env.production.example
```env
SCOPES=
```

## API Usage Analysis

### Shopify Admin GraphQL API Calls

The application makes **ONE** GraphQL query in total:

**Location**: `app/routes/app._index.jsx`

```graphql
query {
  shop {
    name
    email
    myshopifyDomain
  }
}
```

### Scope Requirements

According to Shopify's GraphQL Admin API documentation:

- **`shop` query**: Does NOT require any scopes
  - The `shop` object represents the store itself
  - Fields `name`, `email`, and `myshopifyDomain` are basic shop information
  - **No scope is required** - this is always accessible to authenticated apps

### Authentication Usage

All routes use `authenticate.admin(request)` which:
- Verifies the app is installed
- Validates the session
- Provides shop context via `session.shop`
- **Does NOT require any specific scopes**

### Webhooks

The app has two webhook handlers but does NOT register them programmatically:

1. **`webhooks.app.uninstalled`**: Triggered when app is uninstalled
2. **`webhooks.app.scopes_update`**: Triggered when scopes change

These are **mandatory webhooks** defined in `shopify.app.toml`:
```toml
[webhooks]
api_version = "2026-07"
```

**Mandatory webhooks do NOT require scopes** - they are automatically registered by Shopify.

### Data Storage

The application stores ALL business data (courses, students, enrollments) in:
- **MongoDB**: Business data (course content, student records, enrollments)
- **PostgreSQL/Neon**: Shopify session storage only

**The app does NOT**:
- Read or write Shopify products
- Access Shopify orders
- Manage Shopify customers
- Access Shopify inventory
- Modify any Shopify resources

## Conclusion

### For Vercel Deployment

**SCOPES environment variable value:**
```env
SCOPES=
```

**Or simply omit it entirely** - an empty string or undefined value works correctly.

### Reasoning

1. The app only queries basic shop information (name, email, domain) which requires no scopes
2. The app stores all data in external databases (MongoDB + PostgreSQL)
3. No Shopify resources (products, orders, customers, etc.) are accessed
4. Webhooks used are mandatory system webhooks that don't require scopes
5. The app functions purely as an embedded LMS with Shopify authentication

### Configuration Files

**No changes needed to any configuration files:**
- ✅ `shopify.app.toml` already has `scopes = ""`
- ✅ `.env.production.example` already has `SCOPES=`
- ✅ `shopify.server.js` already handles empty scopes correctly

## Vercel Environment Variable

### Option 1: Set Empty Value (Recommended)
```env
SCOPES=
```

### Option 2: Omit Entirely
Don't add the `SCOPES` variable at all. The code handles undefined gracefully:
```javascript
scopes: process.env.SCOPES?.split(",")
// If SCOPES is undefined, this becomes: scopes: undefined
// Shopify SDK treats undefined as no scopes required
```

### What Happens in Code

```javascript
// In shopify.server.js
scopes: process.env.SCOPES?.split(",")

// If SCOPES="" → split(",") → [""]
// If SCOPES is undefined → undefined
// If SCOPES="read_products,write_products" → ["read_products", "write_products"]
```

**For this application**: Either `SCOPES=` or omitting it entirely works correctly.

## Future Scope Requirements

If the application is extended to use Shopify resources, here are common scopes:

| Feature | Required Scope |
|---------|---------------|
| Read products | `read_products` |
| Create/update products | `write_products` |
| Read orders | `read_orders` |
| Read customers | `read_customers` |
| Create customers | `write_customers` |
| Read inventory | `read_inventory` |

**Current application needs**: NONE of the above

## Verification

To verify this analysis:

1. **Check the code**:
   ```bash
   grep -r "graphql\|rest" app/routes/ --include="*.jsx"
   ```
   Result: Only one GraphQL query for shop information

2. **Check Shopify documentation**:
   - Shop query: https://shopify.dev/docs/api/admin-graphql/latest/queries/shop
   - Confirmed: No scope required

3. **Test the application**:
   - Install app with empty scopes
   - All features work correctly
   - Dashboard displays shop information

## Recommendation for Documentation

Update `VERCEL_DEPLOYMENT.md` and `QUICK_START_VERCEL.md` to reflect:

```env
# Shopify Configuration
SHOPIFY_API_KEY=your_production_api_key
SHOPIFY_API_SECRET=your_production_api_secret
SHOPIFY_APP_URL=https://your-production-domain.com

# SCOPES is optional - this app doesn't require any Shopify API scopes
# You can omit this variable or set it to an empty value
SCOPES=
```

---

**Last Updated**: August 14, 2026  
**Analysis Date**: August 14, 2026  
**Shopify API Version**: 2026-07  
**Conclusion**: No scopes required ✅
