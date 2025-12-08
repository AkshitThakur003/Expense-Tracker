# MERN Stack Template

[![Use this template](https://img.shields.io/badge/Use%20this%20template-2ea44f?style=for-the-badge&logo=github)](https://github.com/new?template_name=mern-boilerplate&template_owner=AkshitThakur003)

A production-ready MERN stack template with JWT authentication, built with MongoDB, Express, React, and Node.js. Features Redux Toolkit, Tailwind CSS, dark mode support, and a complete authentication system with refresh tokens.

Perfect for quickly starting new full-stack projects with authentication already configured.

## ✨ Features

### 🔐 Authentication
- **JWT Authentication** with access and refresh tokens
- Secure password hashing with bcryptjs
- Automatic token refresh via axios interceptors
- Protected routes on both frontend and backend
- Signup, Login, Logout, and Profile management

### 🎨 Frontend
- **React 18** with Vite for fast development
- **Redux Toolkit** for state management
- **Tailwind CSS** with dark mode support
- Responsive Navbar and Sidebar with mobile support
- Toast notifications (react-hot-toast)
- Loading states and protected route wrappers
- Clean, minimal UI design

### ⚙️ Backend
- **Express.js** REST API
- **MongoDB** with Mongoose ODM
- User model with password hashing
- Protected API middleware
- CORS enabled
- Input validation with express-validator

## 🚀 Quick Start

### Using as a GitHub Template

1. Click the **"Use this template"** button at the top of this repository
2. Create a new repository from the template
3. Clone your new repository:
   ```bash
   git clone <your-repo-url>
   cd <your-repo-name>
   ```

### Installation

1. **Install dependencies:**
   ```bash
   npm run install-all
   ```

2. **Set up environment variables**

   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/your-db-name
   JWT_SECRET=your-super-secret-jwt-key-change-this
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
   JWT_EXPIRE=7d
   JWT_REFRESH_EXPIRE=30d
   NODE_ENV=development
   ```

   Create a `.env` file in the `frontend` directory (optional for development):
   ```env
   VITE_API_URL=http://localhost:5000
   ```

   **Backend `.env` - Add for development:**
   ```env
   FRONTEND_URL=http://localhost:3000
   ```

3. **Start MongoDB**

   Make sure MongoDB is running locally or update `MONGODB_URI` with your MongoDB Atlas connection string.

4. **Run the application:**
   ```bash
   npm run dev
   ```

   This starts both servers concurrently with color-coded output:
   - 🔵 **BACKEND** - http://localhost:5000
   - 🟢 **FRONTEND** - http://localhost:3000

   Or run them separately:
   ```bash
   # Terminal 1 - Backend
   npm run server
   
   # Terminal 2 - Frontend
   npm run client
   ```

## 📁 Project Structure

```
├── backend/
│   ├── middleware/
│   │   └── auth.js          # Protected route middleware
│   ├── models/
│   │   └── User.js          # User mongoose model
│   ├── routes/
│   │   ├── auth.js          # Auth routes (signup, login, refresh)
│   │   └── protected.js     # Protected routes example
│   ├── utils/
│   │   └── generateToken.js # JWT token generation
│   ├── server.js            # Express server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── DarkModeToggle.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── Loader.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── pages/           # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Signup.jsx
│   │   ├── redux/           # Redux store and slices
│   │   │   ├── slices/
│   │   │   │   └── authSlice.js
│   │   │   └── store.js
│   │   ├── utils/
│   │   │   └── axios.js     # Axios instance with interceptors
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
├── .eslintrc.json           # ESLint configuration
├── .prettierrc              # Prettier configuration
└── package.json             # Root package.json
```

## 🔑 API Endpoints

### Authentication Routes (`/api/auth`)

- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user (Protected)
- `POST /api/auth/logout` - Logout user (Protected)

### Protected Routes (`/api/protected`)

- `GET /api/protected/dashboard` - Example protected route

All protected routes require a Bearer token:
```
Authorization: Bearer <your-access-token>
```

## 📝 Available Scripts

### Root Level
- `npm run dev` - Run both backend and frontend concurrently
- `npm run server` - Run backend only
- `npm run client` - Run frontend only
- `npm run install-all` - Install dependencies for all projects

### Backend (`backend/`)
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Frontend (`frontend/`)
- `npm start` / `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🎯 How It Works

### Authentication Flow

1. User signs up or logs in → receives access token and refresh token
2. Tokens are stored in localStorage
3. Access token is included in Authorization header for protected routes
4. When access token expires, axios interceptor automatically refreshes it
5. If refresh fails, user is logged out and redirected to login

### Dark Mode

Dark mode preference is saved in localStorage and persists across sessions. Toggle via the button in the navbar.

## 🛠️ Customization

### Adding New Routes

**Backend:**
1. Create a new route file in `backend/routes/`
2. Import and use it in `server.js`

**Frontend:**
1. Add route in `frontend/src/App.jsx`
2. Create page component in `frontend/src/pages/`
3. Add menu item in `frontend/src/components/Sidebar.jsx`

### Adding Sidebar Menu Items

Edit `frontend/src/components/Sidebar.jsx`:
```javascript
const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '...' },
  { name: 'Profile', href: '/profile', icon: '...' },
  // Add more items here
]
```

### Styling

This template uses Tailwind CSS. Customize the theme in `frontend/tailwind.config.js`.

## 🧰 Technologies

**Backend:**
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT (jsonwebtoken)
- bcryptjs
- express-validator

**Frontend:**
- React 18
- Vite
- Redux Toolkit
- React Router DOM
- Axios
- Tailwind CSS
- react-hot-toast

## 📄 License

ISC

## 🤝 Contributing

Found a bug or want to add a feature? Feel free to open an issue or submit a pull request!

---

**Ready to build?** Click "Use this template" and start coding! 🚀
