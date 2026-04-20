# 🔧 Quick Login Test

## Test 1: Direct Browser Console Test

Open your browser console (F12 → Console) and paste this code:

```javascript
// Test API connectivity
fetch('http://185.136.159.142:8080/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ 
    username: 'admin', 
    password: 'admin123' 
  }),
})
.then(response => {
  console.log('Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Response data:', data);
})
.catch(error => {
  console.error('Error:', error);
});
```

## Test 2: Check Network Tab

1. Open Developer Tools (F12)
2. Go to Network tab
3. Try to login with admin/admin123
4. Look for the login request
5. Check if it shows:
   - ❌ Failed (red) - Network issue
   - ✅ 200 OK - API working
   - ❌ 404/500 - Server issue

## Test 3: Simple Curl Test

If you have access to terminal/command prompt, try:

```bash
curl -X POST http://185.136.159.142:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## Expected Results:

### ✅ Success Response:
```json
{
  "status": "success",
  "data": {
    "access_token": "...",
    "user": {
      "username": "admin",
      "email": "admin@example.com"
    }
  }
}
```

### ❌ Error Responses:
- **Network Error**: Can't reach server
- **404 Error**: API endpoint not found
- **401 Error**: Wrong credentials
- **500 Error**: Server error

## Quick Fixes to Try:

1. **Check if server is running**: `http://185.136.159.142:8080`
2. **Try different port**: Maybe it's on 3000, 8000, or 9000
3. **Check CORS**: Browser might be blocking the request
4. **Try localhost**: Maybe the server is running locally

Let me know what you see in the console!