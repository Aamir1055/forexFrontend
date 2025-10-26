# Apache Reverse Proxy Setup for XAMPP

This configuration eliminates CORS errors by proxying the API through Apache on the same origin.

## 1) Enable required Apache modules

Edit `C:\xampp\apache\conf\httpd.conf` and uncomment (remove `#` from):

```apache
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule headers_module modules/mod_headers.so
```

## 2) Configure VirtualHost

Edit `C:\xampp\apache\conf\extra\httpd-vhosts.conf` and add:

```apache
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
  # This makes /api same-origin as the frontend
  ProxyPass        /api http://127.0.0.1:8080/api
  ProxyPassReverse /api http://127.0.0.1:8080/api

  # Optional: preserve client IP and protocol
  RequestHeader set X-Forwarded-Proto "http"
  RequestHeader set X-Forwarded-For "%{REMOTE_ADDR}s"
</VirtualHost>
```

## 3) Verify configuration

```powershell
# In PowerShell or CMD
C:\xampp\apache\bin\httpd.exe -t
```

Should output: `Syntax OK`

## 4) Restart Apache

```powershell
# Stop Apache
net stop Apache2.4

# Start Apache
net start Apache2.4

# Or restart via XAMPP Control Panel
```

## 5) Test the proxy

Open in browser or Postman:

- http://185.136.159.142/api/health

This should proxy to your backend at http://127.0.0.1:8080/api/health

## 6) Rebuild and deploy frontend

The frontend is already configured to use `http://185.136.159.142` as the API base.

```powershell
cd C:\Users\Administrator\Desktop\targetFxFrontend
npm run build
```

Then deploy to XAMPP:

```powershell
# Delete old deployment
if (Test-Path "C:\xampp\htdocs\brk-eye-adm") { Remove-Item -Recurse -Force "C:\xampp\htdocs\brk-eye-adm" }

# Create folder
New-Item -ItemType Directory -Force "C:\xampp\htdocs\brk-eye-adm" | Out-Null

# Copy fresh build
robocopy ".\dist" "C:\xampp\htdocs\brk-eye-adm" /MIR
```

## 7) Test

- Open http://185.136.159.142/brk-eye-adm/login
- Log in
- Navigate to Brokers page
- API calls should succeed without CORS errors

## Troubleshooting

**"503 Service Unavailable" on /api calls:**
- Your backend at port 8080 is not running
- Check that your API server is listening on 127.0.0.1:8080

**Still seeing CORS errors:**
- Verify the proxy rules are in the correct VirtualHost
- Make sure you restarted Apache after config changes
- Clear browser cache and reload the page

**404 on /api:**
- Check that ProxyPass is before any RewriteRule directives
- Verify the backend path matches (e.g., if backend serves at `/auth/login` not `/api/auth/login`, adjust proxy path)
