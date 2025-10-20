import React from 'react'
import { motion } from 'framer-motion'
import { 
  UsersIcon, 
  UserGroupIcon, 
  ShieldCheckIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UserPlusIcon,
  PencilSquareIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { HeartIcon } from '@heroicons/react/24/solid'

const Dashboard: React.FC = () => {
  // Mock data
  const stats = [
    {
      title: 'Total Brokers',
      value: '1,247',
      change: '+12.5%',
      trend: 'up',
      icon: UsersIcon,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Active Users',
      value: '3,892',
      change: '+8.2%',
      trend: 'up',
      icon: UserGroupIcon,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Total Groups',
      value: '156',
      change: '-2.1%',
      trend: 'down',
      icon: ShieldCheckIcon,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'System Health',
      value: '98.5%',
      change: 'All systems operational',
      trend: 'up',
      icon: HeartIcon,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    }
  ]

  const recentActivities = [
    {
      icon: UserPlusIcon,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      title: 'New broker registered',
      description: 'John Smith joined the platform',
      time: '2 min ago'
    },
    {
      icon: PencilSquareIcon,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      title: 'Group settings updated',
      description: 'Premium group permissions modified',
      time: '15 min ago'
    },
    {
      icon: ExclamationTriangleIcon,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      title: 'System alert resolved',
      description: 'Database connection issue fixed',
      time: '1 hour ago'
    },
    {
      icon: ShieldCheckIcon,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      title: 'Role permissions updated',
      description: 'Admin role access level modified',
      time: '3 hours ago'
    }
  ]

  const quickActions = [
    { title: 'Add New Broker', icon: UserPlusIcon, color: 'bg-blue-600' },
    { title: 'Create Group', icon: UserGroupIcon, color: 'bg-green-500' },
    { title: 'Manage Roles', icon: ShieldCheckIcon, color: 'bg-purple-500' },
    { title: 'System Settings', icon: ChartBarIcon, color: 'bg-orange-500' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
              <p className="text-sm text-gray-500 mt-1">Welcome back, here's what's happening today</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <UserPlusIcon className="w-4 h-4" />
              <span>New Broker</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <div className="flex items-center mt-2">
                        {stat.trend === 'up' && stat.title !== 'System Health' ? (
                          <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
                        ) : stat.trend === 'down' ? (
                          <ArrowDownIcon className="w-4 h-4 text-red-500 mr-1" />
                        ) : stat.title === 'System Health' ? (
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        ) : null}
                        <span className={`text-sm ${
                          stat.trend === 'up' ? 'text-green-500' : 
                          stat.trend === 'down' ? 'text-red-500' : 
                          'text-green-500'
                        }`}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* User Activity Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg p-8 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">User Activity</h3>
                <select className="text-base border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                </select>
              </div>
              <div className="h-80 flex items-end justify-between space-x-4 px-4">
                {[820, 932, 901, 934, 1290, 1330, 1320].map((value, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center justify-end">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg hover:from-blue-700 hover:to-blue-500 transition-all cursor-pointer shadow-md"
                      style={{ height: `${Math.max((value / 1500) * 280, 60)}px` }}
                    ></div>
                    <span className="text-sm font-medium text-gray-600 mt-3">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* System Performance Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-lg p-8 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">System Performance</h3>
                <div className="flex space-x-6">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-600 rounded-full mr-2"></div>
                    <span className="text-base text-gray-600">CPU</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-base text-gray-600">Memory</span>
                  </div>
                </div>
              </div>
              <div className="h-80">
                <svg className="w-full h-full" viewBox="0 0 400 200">
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={200 - y * 2}
                      x2="400"
                      y2={200 - y * 2}
                      stroke="#f0f0f0"
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* CPU line */}
                  <polyline
                    points="0,110 57,96 114,104 171,78 228,84 285,90 342,102 400,102"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2"
                  />
                  
                  {/* Memory line */}
                  <polyline
                    points="0,130 57,116 114,122 171,104 228,110 285,118 342,124 400,124"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </motion.div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => {
                  const Icon = activity.icon
                  return (
                    <div key={index} className="flex items-center space-x-4 pb-4 border-b border-gray-100 last:border-0">
                      <div className={`w-10 h-10 ${activity.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${activity.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{activity.time}</span>
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-lg p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={index}
                      className="w-full flex items-center space-x-3 p-3 text-left hover:bg-blue-50 rounded-lg transition-colors group"
                    >
                      <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{action.title}</span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard