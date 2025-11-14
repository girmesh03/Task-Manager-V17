# Quick Start Guide - Task Management SaaS

This guide will help you get the application running locally in under 10 minutes.

---

## Prerequisites

- **Node.js** 18+ (with npm)
- **MongoDB** 6.0+ (running locally or cloud instance)
- **Git** (for cloning)

Optional:
- **Cloudinary Account** (for file uploads)
- **Gmail Account** (for email notifications)

---

## Step 1: Clone & Install

```bash
# Navigate to project root
cd /path/to/project

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../client
npm install
```

---

## Step 2: Configure Environment Variables

### Backend Configuration

```bash
# Copy example file
cd backend
cp .env.example .env

# Edit .env file
nano .env  # or use your favorite editor
```

**Minimum Required Configuration**:
```env
# Backend Environment Variables

# Server Configuration
NODE_ENV=development
PORT=4000

# Database
MONGODB_URI=mongodb://localhost:27017/task-management

# JWT Secrets (GENERATE NEW SECRETS!)
JWT_ACCESS_SECRET=your-random-secret-here-use-crypto
JWT_REFRESH_SECRET=another-random-secret-here-use-crypto

# JWT Expiration
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS Origins
CORS_ORIGIN=http://localhost:5173

# Seed Data (set to true for first run)
INITIALIZE_SEED_DATA=true
```

**Generate Secure Secrets**:
```bash
# Run this in terminal to generate secrets
node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend Configuration

```bash
# Copy example file
cd client
cp .env.example .env

# Edit .env file
nano .env
```

**Required Configuration**:
```env
# Frontend Environment Variables

# API Configuration
VITE_API_URL=http://localhost:4000/api

# Platform Organization ID (leave empty for now)
VITE_PLATFORM_ORG=
```

---

## Step 3: Start MongoDB

### Option A: Local MongoDB
```bash
# Start MongoDB service
mongod --dbpath /path/to/data/db

# Or if installed via brew (macOS)
brew services start mongodb-community

# Or if installed via apt (Linux)
sudo systemctl start mongod
```

### Option B: MongoDB Atlas (Cloud)
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string
4. Replace `MONGODB_URI` in backend/.env

---

## Step 4: Start the Application

### Terminal 1 - Backend
```bash
cd backend
npm run dev

# You should see:
# ✅ Environment variables validated
# 📊 Database connected successfully
# 🚀 Server running on http://localhost:4000
# 🔌 Socket.IO enabled with CORS from configured origins
```

### Terminal 2 - Frontend
```bash
cd client
npm run dev

# You should see:
# VITE v7.x ready in xxx ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
```

---

## Step 5: Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

### First-Time Setup (With Seed Data)

If you set `INITIALIZE_SEED_DATA=true`, the backend will create:
- Platform organization
- Test organizations
- Test users with different roles
- Sample departments
- Sample tasks, materials, vendors

**Default Test Accounts** (if seed data is enabled):
```
SuperAdmin:
Email: superadmin@platform.com
Password: Admin@123

Admin:
Email: admin@hotel.com
Password: Admin@123

Manager:
Email: manager@hotel.com
Password: Manager@123

User:
Email: user@hotel.com
Password: User@123
```

### First-Time Setup (Without Seed Data)

1. Click "Register" on the home page
2. Fill in organization details:
   - Organization Name
   - Industry
   - Contact Information
3. Fill in your user details:
   - Name, Email, Password
   - Position, Role (will be SuperAdmin)
4. Fill in department details:
   - Department Name
   - Description
5. Submit registration
6. You'll be automatically logged in

---

## Step 6: Explore the Application

### As SuperAdmin, you can:
- ✅ Create organizations (platform level)
- ✅ Create departments
- ✅ Create users (all roles)
- ✅ Create and manage tasks
- ✅ Create materials and vendors
- ✅ View all organization data
- ✅ Soft delete and restore resources

### As Admin, you can:
- ✅ Create departments (within your organization)
- ✅ Create users (Admin, Manager, User roles)
- ✅ Create and manage tasks
- ✅ Create materials and vendors
- ✅ View organization and department data

### As Manager, you can:
- ✅ Create users (User role only)
- ✅ Create and manage tasks in your department
- ✅ View materials and vendors

### As User, you can:
- ✅ View tasks assigned to you
- ✅ Update your profile
- ✅ View department resources

---

## Real-Time Testing

To test real-time updates via Socket.IO:

1. Open two browser windows/tabs
2. Log in as different users (or same user)
3. In window 1: Create a task
4. In window 2: Task should appear automatically
5. You should see toast notifications in real-time

---

## API Testing

### Using cURL

```bash
# Health Check
curl http://localhost:4000/health

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@platform.com",
    "password": "Admin@123"
  }' \
  -c cookies.txt

# Get Users (with auth cookie)
curl http://localhost:4000/api/users \
  -b cookies.txt
```

### Using Postman/Thunder Client

1. Import collection from backend/docs (if exists)
2. Set base URL: `http://localhost:4000/api`
3. Authentication: Cookies will be set automatically after login
4. Test all endpoints

---

## Common Issues & Solutions

### Issue: MongoDB Connection Failed
```
Error: MongooseServerSelectionError: connect ECONNREFUSED
```
**Solution**: Ensure MongoDB is running
```bash
# Check MongoDB status
mongosh

# Or start MongoDB
mongod --dbpath /path/to/data
```

### Issue: Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::4000
```
**Solution**: Change PORT in backend/.env or kill the process
```bash
# Find process using port 4000
lsof -i :4000

# Kill process
kill -9 <PID>
```

### Issue: CORS Error in Browser
```
Access to fetch at 'http://localhost:4000/api/...' has been blocked by CORS policy
```
**Solution**: 
1. Check `CORS_ORIGIN` in backend/.env matches frontend URL
2. Restart backend after changing .env
3. Clear browser cache

### Issue: Validation Errors
```
400 Bad Request - Validation failed
```
**Solution**: 
1. Check browser console for detailed error
2. Ensure all required fields are filled
3. Check field format (email, phone, etc.)

### Issue: Token Expired
```
401 Unauthorized - Token expired
```
**Solution**: 
1. Log out and log in again
2. Check JWT expiry settings in backend/.env
3. Ensure cookies are enabled in browser

---

## Optional: Email Configuration

To enable email notifications:

```env
# Add to backend/.env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=Task Management <noreply@taskmanagement.com>
```

**Gmail Setup**:
1. Enable 2-Factor Authentication on your Google account
2. Generate App-Specific Password:
   - Go to Google Account → Security
   - App passwords → Generate
3. Use generated password in EMAIL_PASSWORD

---

## Optional: File Upload Configuration

To enable file uploads (profile pictures, attachments):

```env
# Add to backend/.env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Cloudinary Setup**:
1. Create free account at https://cloudinary.com
2. Get credentials from dashboard
3. Add to .env
4. Restart backend

---

## Development Workflow

### Making Changes

**Backend Changes**:
```bash
# Server will auto-restart with nodemon
cd backend
npm run dev
```

**Frontend Changes**:
```bash
# Vite hot-reloads automatically
cd client
npm run dev
```

### Checking Logs

**Backend Logs**:
- Visible in Terminal 1
- Morgan logs all HTTP requests in development
- Custom logs for Socket.IO events

**Frontend Logs**:
- Open Browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for API calls

### Database Inspection

```bash
# Connect to MongoDB
mongosh

# Switch to database
use task-management

# List collections
show collections

# Query users
db.users.find().pretty()

# Query tasks
db.basetasks.find().pretty()
```

---

## Production Build

### Backend
```bash
cd backend
npm run start:prod
```

### Frontend
```bash
cd client
npm run build

# Output in client/dist folder
# Serve with nginx or serve backend as static
```

---

## Next Steps

1. ✅ Explore all features
2. ✅ Test with different user roles
3. ✅ Try creating tasks, materials, vendors
4. ✅ Test real-time updates
5. ✅ Review code structure
6. ✅ Read FINAL_VALIDATION_REPORT.md for details

---

## Additional Resources

- **API Documentation**: Check `backend/routes/` for endpoint definitions
- **Component Documentation**: Check `client/src/components/` for PropTypes
- **Validation Rules**: Check `backend/middlewares/validators/` for field requirements
- **Constants**: Check `backend/utils/constants.js` and `client/src/utils/constants.js`

---

## Support

For issues or questions:
1. Check FINAL_VALIDATION_REPORT.md
2. Check VALIDATION_FINDINGS.md
3. Review backend logs and frontend console
4. Check MongoDB connection and data

---

## Quick Reference

### Backend Structure
```
backend/
├── app.js                 # Express app configuration
├── server.js              # Server entry point
├── config/                # Configuration files
├── controllers/           # Business logic
├── middlewares/           # Auth, validation, error handling
├── models/                # Mongoose schemas
├── routes/                # API routes
├── services/              # Email, notifications
└── utils/                 # Helpers, constants, Socket.IO
```

### Frontend Structure
```
client/
├── src/
│   ├── App.jsx            # Root component
│   ├── main.jsx           # Entry point
│   ├── components/        # Reusable components
│   ├── pages/             # Page components
│   ├── layouts/           # Layout components
│   ├── redux/             # State management
│   ├── services/          # Socket.IO service
│   ├── hooks/             # Custom hooks
│   ├── utils/             # Utilities, constants
│   └── theme/             # MUI theme
```

---

**Happy Coding! 🚀**
