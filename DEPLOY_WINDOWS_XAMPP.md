# Deploy Admin Panel to XAMPP (Windows)

This guide deploys the admin at http://185.136.159.142/brk-eye-adm/

## 1) Build clean

```powershell
cd C:\Users\Administrator\Desktop\targetFxFrontend
npm run build:clean
```

## 2) Deploy to XAMPP htdocs

```powershell
# Delete old deployment (safe if missing)
if (Test-Path "C:\xampp\htdocs\brk-eye-adm") { Remove-Item -Recurse -Force "C:\xampp\htdocs\brk-eye-adm" }

# Create folder
New-Item -ItemType Directory -Force "C:\xampp\htdocs\brk-eye-adm" | Out-Null

# Copy fresh build (includes .htaccess)
robocopy ".\dist" "C:\xampp\htdocs\brk-eye-adm" /MIR

# Optional: restart Apache service (name may vary)
# net stop Apache2.4
# net start Apache2.4
```

## 3) Apache requirements

- Ensure AllowOverride is enabled so .htaccess is honored:

```
<Directory "C:/xampp/htdocs/brk-eye-adm">
  AllowOverride All
  Require all granted
</Directory>
```

- No special root rewrite needed. If you later add a root app that rewrites all paths, exclude the admin path:

```
RewriteCond %{REQUEST_URI} !^/brk-eye-adm/
```

## 4) Verify

- Open http://185.136.159.142/brk-eye-adm/login (Incognito)
- Login → you should land at /brk-eye-adm/
- Logout → you should land at /brk-eye-adm/login
- Deep links like /brk-eye-adm/brokers refresh fine (SPA rewrite)

## 5) Pointing the frontend to your API

- The admin now reads the API origin from the env var `VITE_API_BASE_URL`.
- Set it in `.env.production`, then rebuild and redeploy.

Examples:

```
VITE_API_BASE_URL=http://185.136.159.142:8080   # API on port 8080
# or
VITE_API_BASE_URL=http://185.136.159.142        # Reverse-proxied API on port 80 under /api
# or
VITE_API_BASE_URL=https://api.your-domain.tld   # Hosted API
```

Quick health check (in browser or Postman):

- http://185.136.159.142:8080/api/health (replace origin as needed)

## 6) Eliminate CORS in production (recommended)

If your API is on a different port (e.g., :8080), browsers will enforce CORS and block calls unless the API sets the correct headers. You can avoid CORS entirely by reverse-proxying /api on Apache to your backend so the origin stays the same as the frontend.

1) Enable required Apache modules (in httpd.conf):

```
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule headers_module modules/mod_headers.so
```

2) In your VirtualHost for 185.136.159.142:80 (httpd-vhosts.conf), add:

```
<VirtualHost *:80>
  ServerName 185.136.159.142

  DocumentRoot "C:/xampp/htdocs"
  <Directory "C:/xampp/htdocs">
    AllowOverride All
    Require all granted
  </Directory>

  # Serve admin SPA at /brk-eye-adm
  Alias /brk-eye-adm "C:/xampp/htdocs/brk-eye-adm"
  <Directory "C:/xampp/htdocs/brk-eye-adm">
    AllowOverride All
    Require all granted
  </Directory>

  # Reverse proxy API to backend on port 8080
  ProxyPass        /api http://127.0.0.1:8080/api
  ProxyPassReverse /api http://127.0.0.1:8080/api

  # Optional: if your backend needs Host or CORS headers
  RequestHeader set X-Forwarded-Proto "http"
  RequestHeader set X-Forwarded-For "%{REMOTE_ADDR}s"
</VirtualHost>
```

3) Set the frontend to call same-origin API by updating `.env.production`:

```
VITE_API_BASE_URL=http://185.136.159.142
```

4) Rebuild and redeploy the frontend, then test:

- http://185.136.159.142/api/health should proxy to your backend.

If you prefer to keep the API on a separate origin, configure CORS on the backend to allow:

- Access-Control-Allow-Origin: http://185.136.159.142
- Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Access-Control-Allow-Headers: Authorization, Content-Type
- Access-Control-Allow-Credentials: true (only if you use cookies)
- Properly handle OPTIONS preflight (return 204/200)
