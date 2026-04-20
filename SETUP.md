# User Management System - Setup Guide

## 🚀 Current Status

The application is now running with **automatic fallback system**:

- ✅ **Tries real API first** - Attempts to connect to `http://185.136.159.142:8080`
- ✅ **Falls back to mock data** - If API fails (CORS/Auth issues), uses demo data
- ✅ **Visual status indicator** - Shows "API Connected" or "Using Mock Data" in header
- ✅ **Full functionality** - All features work regardless of API status

## 🌐 Access the Application

**URL:** http://localhost:3001/

The app will automatically:
1. Try to connect to your real API
2. If it fails (due to CORS or authentication), show mock data
3. Display the connection status in the header

## 🔧 API Connection Issues

### CORS Error (Most Common)
The browser blocks requests due to CORS policy. Solutions:

**Option 1: Backend CORS Configuration (Recommended)**
Add these headers to your backend:
```
Access-Control-Allow-Origin: http://185.136.159.142:3001
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization
```

**Option 2: Use Vite Proxy (Current Setup)**
The app uses Vite proxy to route `/api/*` requests to your backend.

### Authentication Issues
If your API requires authentication:

**Set Token in Browser:**
1. Open Developer Tools (F12)
2. Console tab
3. Run: `localStorage.setItem('authToken', 'your-jwt-token')`
4. Refresh page

## 📊 Features Working Now

### With Mock Data (Always Available)
- ✅ View 5 sample users with different roles
- ✅ Create new users (simulated)
- ✅ Edit user information
- ✅ Delete users
- ✅ Toggle active/inactive status
- ✅ Role assignment (Admin, User, Broker, Client)
- ✅ Responsive mobile interface

### With Real API (When Connected)
- ✅ Real database operations
- ✅ Actual user management
- ✅ Live data synchronization
- ✅ Backend validation

## 🎯 Next Steps

1. **Test the interface** - Works immediately with mock data
2. **Fix CORS** - Configure your backend for cross-origin requests
3. **Add authentication** - Set up proper login system
4. **Customize** - Modify styling and add features as needed

## 🔍 Troubleshooting

**Check API Status:**
- Look at the status indicator in the header
- Green "API Connected" = Using real backend
- Yellow "Using Mock Data" = Fallback mode

**Console Logs:**
- Open Developer Tools → Console
- Look for "API call failed" messages
- Shows specific error details

The system is designed to work seamlessly regardless of backend connectivity! 🚀