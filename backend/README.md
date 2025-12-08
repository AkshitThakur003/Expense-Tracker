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
```

**Important:** 
- Change the JWT secrets to secure random strings (minimum 32 characters) in production!
- Use MongoDB Atlas connection string for production
- Set FRONTEND_URL to your frontend domain for CORS

## Starting the Server

```bash
npm run dev
```

The server will start on port 5000 (or the port specified in your `.env` file).

## Production Build

```bash
npm start
```
