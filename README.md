# User Management System

A modern, responsive User Management System built with React, TypeScript, and Tailwind CSS. Features a clean sidebar navigation, comprehensive user CRUD operations, and mobile-friendly design.

## 🚀 Features

- **📱 Responsive Design** - Works perfectly on mobile, tablet, and desktop
- **🎨 Modern UI** - Built with Tailwind CSS and Heroicons
- **👥 User Management** - Complete CRUD operations for users
- **🔐 Role Management** - Create, edit, and delete roles with permissions
- **🔑 Permission System** - Comprehensive permission management and role assignment
- **🏢 Broker Management** - Full broker CRUD with filtering, sorting, and pagination
- **⚙️ Settings Module** - Account settings with 2FA security setup
- **🔒 Authentication** - Secure login with JWT tokens and 2FA support
- **📊 Real-time Stats** - User statistics and pagination
- **🔄 API Integration** - Full integration with backend APIs
- **⚡ Fast Performance** - Built with Vite for lightning-fast development

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Data fetching and caching
- **React Hook Form** - Form handling and validation
- **React Router** - Client-side routing
- **Heroicons** - Beautiful SVG icons
- **Vite** - Fast build tool and dev server

## 📋 API Endpoints

The application integrates with the following backend endpoints:

### User Management
- `GET /api/users?page=1&limit=20` - Get paginated users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PATCH /api/users/:id/toggle-status` - Toggle user status

### Role Management
- `GET /api/roles?include_permissions=true` - Get all roles with permissions
- `GET /api/roles/:id` - Get role by ID
- `POST /api/roles` - Create new role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role

### Permission Management
- `GET /api/permissions` - Get all permissions
- `GET /api/roles/:roleId/permissions` - Get permissions for a role
- `POST /api/roles/:roleId/permissions` - Add permission to role
- `DELETE /api/roles/:roleId/permissions/:permissionId` - Remove permission from role
- `POST /api/roles/:roleId/permissions/sync` - Sync role permissions (bulk update)

### User Role Assignment
- `GET /api/users/:userId/roles` - Get user roles
- `POST /api/users/:userId/roles` - Assign role to user
- `DELETE /api/users/:userId/roles/:roleId` - Revoke role from user

### Broker Management
- `GET /api/brokers` - Get brokers with filtering, sorting, and pagination
- `GET /api/brokers/:id` - Get broker by ID
- `POST /api/brokers` - Create new broker
- `PUT /api/brokers/:id` - Update broker
- `DELETE /api/brokers/:id` - Delete broker
- `PATCH /api/brokers/:id/toggle-status` - Toggle broker status

### Authentication & Security
- `POST /api/auth/login` - User login with optional 2FA
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/2fa/setup` - Setup 2FA with QR code
- `POST /api/auth/2fa/enable` - Enable 2FA with verification code
- `POST /api/auth/2fa/disable` - Disable 2FA with password
- `POST /api/auth/2fa/backup-codes` - Regenerate backup codes

## 🚀 Getting Started

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment:**
```bash
# Create .env file
VITE_API_URL=http://185.136.159.142:8080
```

3. **Start development server:**
```bash
npm run dev
```

4. **Build for production:**
```bash
npm run build
```

## 📱 Mobile Compatibility

The application is fully responsive and mobile-compatible:

- **Responsive Sidebar** - Collapsible navigation for mobile
- **Mobile-first Tables** - Card layout on small screens
- **Touch-friendly UI** - Optimized for touch interactions
- **PWA Ready** - Can be installed as a mobile app

## 🎯 Key Components

### Layout Components
- **Sidebar** - Navigation with active state indicators
- **Header** - Top navigation with mobile menu toggle
- **Layout** - Main layout wrapper with responsive behavior

### User Management
- **UserTable** - Responsive table with pagination
- **UserModal** - Create/edit user form with validation
- **Role Selection** - Multi-select role assignment

### Features
- **Real-time Updates** - Instant UI updates after API calls
- **Form Validation** - Client-side validation with error messages
- **Loading States** - Skeleton loaders and loading indicators
- **Toast Notifications** - Success/error feedback
- **Pagination** - Navigate through large user lists

## 🔧 Configuration

### API Configuration
Update the API base URL in `.env`:
```
VITE_API_URL=your_backend_url
```

### Proxy Configuration
For development, the Vite proxy is configured in `vite.config.ts`:
```typescript
proxy: {
  '/api': {
    target: 'http://185.136.159.142:8080',
    changeOrigin: true,
    secure: false,
  }
}
```

## 📊 User Data Structure

```typescript
interface User {
  id: number
  username: string
  email: string
  is_active: boolean
  created_at: string
  updated_at: string
  roles: Role[]
}

interface Role {
  id: number
  name: string
  description: string
}
```

## 🎨 Customization

### Colors
Update the color scheme in `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        50: '#eff6ff',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
      }
    }
  }
}
```

### Styling
All styles use Tailwind CSS classes. Custom components are defined in `src/index.css`.

## 🚀 Deployment

1. **Build the project:**
```bash
npm run build
```

2. **Deploy the `dist` folder** to your web server

3. **Configure environment variables** for production

## 📱 Mobile App Features

- **Responsive Navigation** - Slide-out sidebar on mobile
- **Touch Gestures** - Swipe and tap interactions
- **Optimized Performance** - Fast loading on mobile networks
- **Offline Ready** - Can be enhanced with service workers

The application is designed to work seamlessly across all devices and can be easily converted to a Progressive Web App (PWA) for native-like mobile experience.

## 🔄 Development

- **Hot Reload** - Instant updates during development
- **TypeScript** - Full type checking and IntelliSense
- **ESLint** - Code quality and consistency
- **Modern Build** - Optimized production builds

Your User Management System is now ready for production use! 🎉