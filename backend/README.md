# Backend Setup

## Environment Variables

Create a `.env` file in this directory with the following variables:

### Development
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mern-boilerplate
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this-in-production
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DISABLE_RATE_LIMIT=true  # Optional: Disable rate limiting in development (automatically disabled if NODE_ENV=development)
AUTH_RATE_LIMIT_MAX=15  # Optional: Max auth requests per 15 minutes (default: 15, ignored if rate limiting is disabled)
```

### Production
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-min-32-characters
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
DISABLE_RATE_LIMIT=false  # Optional: Keep rate limiting enabled in production (default: enabled)
AUTH_RATE_LIMIT_MAX=10  # Optional: Max auth requests per 15 minutes (default: 15, recommended: 10 for production)
```

**Important:** 
- Change the JWT secrets to secure random strings (minimum 32 characters) in production!
- Use MongoDB Atlas connection string for production
- Set FRONTEND_URL to your frontend domain for CORS
- **Rate Limiting:**
  - Rate limiting is **automatically disabled** when `NODE_ENV=development`
  - You can also explicitly disable it by setting `DISABLE_RATE_LIMIT=true`
  - `AUTH_RATE_LIMIT_MAX` controls rate limiting for authentication routes (login/signup). Default is 15 requests per 15 minutes. Lower this value in production for better security.
  - General API routes: 100 requests per 15 minutes
  - Auth routes: 15 requests per 15 minutes (configurable via `AUTH_RATE_LIMIT_MAX`)

## Starting the Server

```bash
npm run dev
```

The server will start on port 5000 (or the port specified in your `.env` file).

## Production Build

```bash
npm start
```
