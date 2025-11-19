import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  Users,
  Shield, 
  Building2, 
  FileText,
  Layers,
  Settings,
  X,
  ChevronRight,
  LogOut,
  Sparkles,
  ClipboardList,
  FileSpreadsheet,
  ScrollText,
  Activity
} from 'lucide-react'
import { cn } from '../lib/utils'
import { authService } from '../services/authService'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../contexts/PermissionContext'
import { MODULES } from '../utils/permissions'
import toast from 'react-hot-toast'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface NavigationItem {
  name: string
  href: string
  icon: any
  module?: string  // Module name for permission checking
}

const allNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, module: MODULES.DASHBOARD },
  { name: 'Users', href: '/users', icon: Users, module: MODULES.USERS },
  { name: 'Roles', href: '/roles', icon: Shield, module: MODULES.ROLES },
  { name: 'Brokers', href: '/brokers', icon: Building2, module: MODULES.BROKERS },
  { name: 'Broker Profiles', href: '/broker-profiles', icon: FileText, module: MODULES.BROKER_PROFILES },
  { name: 'Groups', href: '/groups', icon: Layers, module: MODULES.GROUPS },
  { name: 'Rules', href: '/rules', icon: ScrollText, module: MODULES.RULES },
  { name: 'Audit Logs', href: '/audit-logs', icon: ClipboardList, module: MODULES.AUDIT_LOGS },
  { name: 'Logs', href: '/logs', icon: FileSpreadsheet, module: MODULES.LOGS },
  { name: 'API Metrics', href: '/api-metrics', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings, module: MODULES.PROFILE },
]

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navigate = useNavigate()
  const { canViewModule, isAdmin, user, permissions } = usePermissions()

  // Filter navigation items based on user permissions
  const navigation = allNavigation.filter(item => {
    // If user is admin, show everything
    if (isAdmin) {
      return true
    }
    
    // Always show Dashboard
    if (item.href === '/') {
      return true
    }
    
    // If no module specified, show the item
    if (!item.module) {
      return true
    }
    
    // Check if user has permission to view the module
    return canViewModule(item.module)
  })

  const { logout } = useAuth()
  const handleLogout = async () => {
    // Clear local auth immediately
    logout()
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error (continuing):', error)
    }
    toast.success('Logged out successfully')
    const base = (import.meta as any).env?.VITE_ADMIN_BASE_URL || `${window.location.protocol}//${window.location.host}/brk-eye-adm`
    const normalized = (typeof base === 'string' && base.endsWith('/')) ? base : `${base}/`
    const loginUrl = `${normalized}login`
    // Hard redirect to prevent history back to protected pages
    window.location.replace(loginUrl)
  }

  return (
    <>
      {/* Desktop sidebar */}
      <motion.div 
        className="hidden lg:flex lg:flex-shrink-0"
        animate={{ width: isCollapsed ? '5rem' : '16rem' }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col bg-white shadow-xl border-r border-gray-200 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center space-x-3"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      UserAdmin
                    </h1>
                    <p className="text-xs text-gray-500 font-medium">Management Pro</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 text-gray-400 hover:text-gray-600 border border-gray-200 hover:border-gray-300"
            >
              <ChevronRight className={cn(
                "w-4 h-4 transition-transform duration-300",
                isCollapsed ? "rotate-0" : "rotate-180"
              )} />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 px-4 py-6">
            <nav className="space-y-1">
              {navigation.map((item, index) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group relative",
                        isActive
                          ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <Icon className={cn(
                        "w-5 h-5 transition-all duration-200 flex-shrink-0",
                        "group-hover:scale-105",
                        isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                      )} />
                      
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="font-medium"
                          >
                            {item.name}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>
                  </motion.div>
                )
              })}
            </nav>
          </div>
          
          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group text-gray-600 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-medium"
                  >
                    Sign Out
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={onClose}
            />
            
            {/* Sidebar */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">
                        UserAdmin
                      </h1>
                      <p className="text-xs text-gray-500 font-medium">Management Pro</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 px-4 py-6 overflow-y-auto">
                  <nav className="space-y-1">
                    {navigation.map((item, index) => {
                      const Icon = item.icon
                      const isActive = location.pathname === item.href
                      
                      return (
                        <motion.div
                          key={item.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Link
                            to={item.href}
                            onClick={onClose}
                            className={cn(
                              "flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group relative",
                              isActive
                                ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                          >
                            <Icon className={cn(
                              "w-5 h-5 transition-transform duration-200",
                              "group-hover:scale-105",
                              isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                            )} />
                            
                            <span className="font-medium">{item.name}</span>
                          </Link>
                        </motion.div>
                      )
                    })}
                  </nav>
                </div>
                
                {/* Mobile Logout Button */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => {
                      onClose()
                      handleLogout()
                    }}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 text-gray-600 hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Sidebar

