# Timezone Management Setup

## 🎯 Objective

Implementation of a robust timezone management system for the SaaS task manager to ensure consistent date/time handling across global users, backend server, and MongoDB database.

## 📋 Implementation Steps

### 1. **Already Installed Required Dependencies**

#### Backend (server/package.json):

```json
"dependencies": {
  "dayjs": "^1.11.18",
}
```

#### Frontend (client/package.json):

```json
"dependencies": {
  "dayjs": "^1.11.18",
}
```

### 2. **Backend Configuration**

#### A. Server Timezone Setup (app.js)

```javascript
// Add at the top of app.js
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Force UTC timezone for entire backend
process.env.TZ = "UTC";
```

#### B. Mongoose Schema Configuration

All models with date fields to:

- Store dates as UTC in database
- Automatically convert to UTC when saving
- Return ISO strings in API responses

#### C. API Controller Updates

All controllers to:

- Convert incoming dates to UTC before saving
- Return dates in ISO format for consistency

### 3. **Frontend Configuration**

#### A. Create Date Utility File (src/utils/dateUtils.js)

Utility functions for:

- Getting user's timezone
- Converting UTC → local time for display
- Converting local time → UTC for API calls
- Formatting dates for UI components

#### B. API Service Layer Updates

All API calls to:

- Convert local dates to UTC before sending to backend
- Handle UTC dates returned from backend

#### C. React Component Integration

All components using dates to:

- Use the date utility functions
- Properly handle DateTimePicker components
- Display dates in user's local timezone

## 🎨 Key Features to Implement

### Backend Features:

- ✅ UTC as default server timezone
- ✅ Automatic UTC conversion in Mongoose models
- ✅ Consistent ISO date format in API responses
- ✅ UTC storage for all date fields

### Frontend Features:

- ✅ User timezone detection
- ✅ Transparent UTC ↔ local time conversion
- ✅ Proper date handling in forms and displays
- ✅ MUI DateTimePicker integration

## 🔧 Core Principles

1. **Store in UTC**: All database dates stored in UTC
2. **Convert at Boundaries**:
   - Frontend → Backend: Local → UTC
   - Backend → Frontend: UTC → Local
3. **Use ISO Format**: Standardized date communication
4. **Dayjs Consistency**: Use same dayjs setup across frontend/backend

## 📝 Verification Checklist

- [ ] Backend stores all dates in UTC
- [ ] Users see dates in their local timezone
- [ ] Date inputs work correctly across timezones
- [ ] Mongoose timestamps are UTC
- [ ] No timezone conflicts in API communication
- [ ] DateTimePicker components show local times
- [ ] Task deadlines display correctly for all users

## 🚀 Expected Outcome

After implementation, this Multi-Tenant SaaS Task Manager will handle dates consistently regardless of where users are located, with automatic timezone conversion ensuring everyone sees the correct dates and times for their location.
