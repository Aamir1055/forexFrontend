import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, 
  LogOut, 
  User, 
  Settings, 
  Bell,
  Search,
  Sun,
  Moon
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { authService } from '../services/authService'
import ApiStatus from './ApiStatus'
import toast from 'react-hot-toast'


interface HeaderProps {
  onMenuClick: () => void
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const navigate = useNavigate()
  const { logout } = useAuth()
  const currentUser = authService.getCurrentUser()

  const handleLogout = async () => {
    setShowDropdown(false)

    // Clear auth state immediately so ProtectedRoute blocks dashboard
    logout()

    try {
      // Try to invalidate server token (non-blocking for UX)
      await authService.logout()
    } catch (error) {
      console.error('Logout API error (continuing anyway):', error)
    }

    // Compute absolute login URL to avoid any SPA/basename edge cases
    const envBase = (import.meta as any).env?.VITE_ADMIN_BASE_URL as string | undefined
    const fallbackBase = `${window.location.protocol}//${window.location.host}/brk-eye-adm`
    const base = (envBase && envBase.trim().length > 0) ? envBase : fallbackBase
    const normalized = base.endsWith('/') ? base : `${base}/`
    const loginUrl = `${normalized}login`

    toast.success('Logged out successfully')
    // Hard redirect so the browser history can't go "back" into an authed page
    window.location.replace(loginUrl)
  }

  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="relative z-10 flex-shrink-0 flex h-16 bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50"
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="px-4 border-r border-gray-200/50 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden transition-colors"
      >
        <Menu className="h-6 w-6" />
      </button>
      
      <div className="flex-1 px-4 flex justify-between items-center">
        {/* Left side */}
        <div className="flex-1 flex items-center space-x-6">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent hidden md:block"
          >
            User Management Pro
          </motion.h2>
          
          {/* Search bar */}
          <div className="hidden md:flex relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
            />
          </div>
          
          <ApiStatus />
        </div>
        
        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            </span>
          </button>
          
          {/* User dropdown */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {currentUser?.username || 'User'}
                </p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-sm font-bold text-white">
                    {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
            </motion.button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="origin-top-right absolute right-0 mt-2 w-56 rounded-2xl shadow-xl bg-white/90 backdrop-blur-xl ring-1 ring-black/5 border border-gray-200/50 overflow-hidden"
                >
                  <div className="p-2">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {currentUser?.username || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {currentUser?.email || 'admin@example.com'}
                      </p>
                    </div>
                    
                    {/* Menu items */}
                    <div className="py-2 space-y-1">
                      <button
                        onClick={() => {
                          navigate('/settings')
                          setShowDropdown(false)
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        <User className="h-4 w-4 mr-3 text-gray-400" />
                        Profile
                      </button>
                      
                      <button
                        onClick={() => {
                          navigate('/settings')
                          setShowDropdown(false)
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        <Settings className="h-4 w-4 mr-3 text-gray-400" />
                        Settings
                      </button>
                      
                      <div className="border-t border-gray-100 my-2"></div>
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Backdrop to close dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-0" 
            onClick={() => setShowDropdown(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default Header

