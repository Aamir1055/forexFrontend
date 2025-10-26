# Enable CORS on Your Backend

Your frontend is calling: `http://185.136.159.142:8080/api/...`

Your backend needs to allow requests from: `http://185.136.159.142`

## If your backend is FastAPI (Python):

```python
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://185.136.159.142",
        "http://185.136.159.142:80",
        "http://localhost:5173",  # for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## If your backend is Node.js/Express:

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://185.136.159.142',
    'http://localhost:5173'
  ],
  credentials: true
}));
```

## If your backend is Flask (Python):

```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=[
    "http://185.136.159.142",
    "http://localhost:5173"
])
```

## After enabling CORS:

1. Restart your backend server on port 8080
2. Copy the `dist/` folder to `C:\xampp\htdocs\brk-eye-adm\`
3. Access: `http://185.136.159.142/brk-eye-adm/`
4. Login and logout will work perfectly!

## To verify CORS is working:

Open browser console and check if you see:
- ❌ `CORS policy` errors → CORS not enabled yet
- ✅ No CORS errors → CORS working correctly!
