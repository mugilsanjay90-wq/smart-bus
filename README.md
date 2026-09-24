# 🚌 Smart Bus Tracking - Akshaya College

Production-ready MERN stack application for real-time bus tracking with QR-based attendance.

## ✅ Features

- **Real-time GPS Tracking** - Live bus location on map
- **QR Attendance** - Auto-refresh QR every 10 seconds
- **Protected Routes** - Can't access pages without login
- **Department Management** - Organize students by department
- **Excel Import/Export** - Bulk operations
- **Auto Ride End** - When bus reaches college campus

## 🚀 Local Setup

### Backend
```bash
cd Backend
npm install
# Create .env file (see .env.example)
npm start
```

### Frontend
```bash
cd Frontend
npm install
npm run dev
```

## 🌐 Hosting Instructions

### Step 1: MongoDB Atlas (Database)

1. Go to https://cloud.mongodb.com
2. Create FREE M0 cluster
3. **Database Access** → Add user (username/password)
4. **Network Access** → Allow from anywhere (0.0.0.0/0)
5. **Connect** → Copy connection string

Example:
```
mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/smartbus?retryWrites=true&w=majority
```

---

### Step 2: Deploy Backend on Railway

1. Go to https://railway.app
2. **New Project** → **Deploy from GitHub**
3. Select your backend repo
4. Add **Environment Variables**:

| Variable | Value |
|----------|-------|
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `ADMIN_EMAIL` | admin@smartbus.com |
| `ADMIN_PASSWORD` | admin123 |

5. **Settings** → **Generate Domain**
6. Copy your backend URL (e.g., `https://xxx.up.railway.app`)

---

### Step 3: Update Frontend API URL

In `Frontend/src/config.js`, change:
```javascript
export const API_URL = "https://YOUR-BACKEND-URL.up.railway.app";
```

OR set environment variable in hosting:
```
VITE_API_URL=https://YOUR-BACKEND-URL.up.railway.app
```

---

### Step 4: Deploy Frontend on Vercel

1. Go to https://vercel.com
2. **Import** your frontend repo
3. Add Environment Variable:
   - `VITE_API_URL` = `https://YOUR-BACKEND-URL.up.railway.app`
4. Deploy!

---

## 📁 Project Structure

```
smart-bus-production/
├── Backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Bus.js
│   │   └── Attendance.js
│   ├── index.js
│   ├── package.json
│   └── .env.example
│
├── Frontend/
│   ├── src/
│   │   ├── Components/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── AdminPanel.jsx
│   │   │   ├── DriverPanel.jsx
│   │   │   └── StudentMap.jsx
│   │   ├── App.jsx
│   │   ├── config.js
│   │   └── index.css
│   ├── package.json
│   └── .npmrc
│
├── .gitignore
└── README.md
```

## 🔐 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@smartbus.com | admin123 |
| Driver | (add via admin) | (set when adding) |
| Student | (register or add via admin) | (set when registering) |

## ⚠️ Important Notes

1. **Always use MongoDB Atlas** for hosting (not local MongoDB)
2. **Add `.gitignore`** before pushing to GitHub
3. **Never commit `.env`** file
4. **Update `config.js`** with your backend URL before deploying frontend
5. QR codes refresh every **10 seconds** for security

## 🛠️ Troubleshooting

### MongoDB Connection Error
- Check if IP is whitelisted in Atlas
- Verify connection string has database name (`/smartbus?`)
- Try using non-SRV connection string if DNS issues

### CORS Error
- Backend already configured for all origins
- If issues, check backend is running

### Routes Not Protected
- Clear localStorage and try again
- Check if role is being set correctly on login

---

Built for Akshaya College of Engineering and Technology 🏫


https://cloud.mongodb.com/v2/6aaad28fa9b8b097936b4c81#/explorer/6aaad2b0880835666bea807b/test/users/find