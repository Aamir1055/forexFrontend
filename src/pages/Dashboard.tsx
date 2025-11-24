import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import BrokerModal from '../components/BrokerModal'
import GroupModal from '../components/GroupModal'
import { useMutation, useQueryClient } from 'react-query'
import { brokerService } from '../services/brokerService'
import { groupService } from '../services/groupService'
import { CreateBrokerData, CreateGroupData } from '../types'
import toast from 'react-hot-toast'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  // Modal states
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false)
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)

  // Mutations for creating entities
  const createBrokerMutation = useMutation(
    (brokerData: CreateBrokerData) => brokerService.createBroker(brokerData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['brokers'])
        setIsBrokerModalOpen(false)
        toast.success('Broker created successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create broker')
      }
    }
  )

  const createGroupMutation = useMutation(
    (groupData: CreateGroupData) => groupService.createGroup(groupData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['groups'])
        setIsGroupModalOpen(false)
        toast.success('Group created successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create group')
      }
    }
  )

  // Handle Quick Action clicks
  const handleQuickAction = (action: string) => {
    console.log('Quick Action clicked:', action)
    
    switch (action) {
      case 'Add New Broker':
        setIsBrokerModalOpen(true)
        break
      case 'Create Group':
        setIsGroupModalOpen(true)
        break
      case 'Manage Roles':
        navigate('/roles')
        break
      case 'System Settings':
        navigate('/settings')
        break
      default:
        console.log('Unknown action:', action)
    }
  }
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
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
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
    { title: 'Create Group', icon: UserGroupIcon, color: 'bg-yellow-500' },
    { title: 'Manage Roles', icon: ShieldCheckIcon, color: 'bg-purple-500' },
    { title: 'System Settings', icon: ChartBarIcon, color: 'bg-orange-500' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      {/* Compact Header with Glass Effect */}
      <div className="px-4 pt-3 pb-2">
        <header className="backdrop-blur-xl border rounded-xl shadow-lg bg-white/80 border-white/60 shadow-blue-500/5">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-md shadow-blue-500/30">
                    <ChartBarIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-yellow-500 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Dashboard Overview
                  </h1>
                  <p className="text-xs font-medium text-slate-500">
                    Welcome back, here's what's happening today
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleQuickAction('Add New Broker')}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 font-semibold text-xs group"
                >
                  <UserPlusIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                  <span>New Broker</span>
                </button>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Main Content */}
      <main className="p-4">
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="backdrop-blur-xl rounded-xl p-4 shadow-lg border transition-all duration-300 hover:scale-105 bg-white/80 border-white/60 shadow-blue-500/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-medium mb-1 text-slate-500">{stat.title}</p>
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      <div className="flex items-center mt-2">
                        {stat.trend === 'up' && stat.title !== 'System Health' ? (
                          <ArrowUpIcon className="w-4 h-4 text-yellow-500 mr-1" />
                        ) : stat.trend === 'down' ? (
                          <ArrowDownIcon className="w-4 h-4 text-red-500 mr-1" />
                        ) : stat.title === 'System Health' ? (
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                        ) : null}
                        <span className={`text-xs font-semibold ${
                          stat.trend === 'up' ? 'text-yellow-500' : 
                          stat.trend === 'down' ? 'text-red-500' : 
                          'text-yellow-500'
                        }`}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bgColor}`}>
                      <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* User Activity Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="backdrop-blur-xl rounded-xl p-6 shadow-lg border bg-white/80 border-white/60 shadow-blue-500/5"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">User Activity</h3>
                <select className="text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-slate-300 text-slate-700">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                </select>
              </div>
              <div className="h-64 flex items-end justify-between space-x-3 px-4">
                {[820, 932, 901, 934, 1290, 1330, 1320].map((value, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center justify-end">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg hover:from-blue-700 hover:to-blue-500 transition-all cursor-pointer shadow-md"
                      style={{ height: `${Math.max((value / 1500) * 230, 50)}px` }}
                    ></div>
                    <span className="text-xs font-medium mt-2 text-slate-600">
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
              className="backdrop-blur-xl rounded-xl p-6 shadow-lg border bg-white/80 border-white/60 shadow-blue-500/5"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">System Performance</h3>
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-600 rounded-full mr-1.5"></div>
                    <span className="text-xs text-slate-600">CPU</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1.5"></div>
                    <span className="text-xs text-slate-600">Memory</span>
                  </div>
                </div>
              </div>
              <div className="h-64">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="lg:col-span-2 backdrop-blur-xl rounded-xl p-6 shadow-lg border bg-white/80 border-white/60 shadow-blue-500/5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {recentActivities.map((activity, index) => {
                  const Icon = activity.icon
                  return (
                    <div key={index} className="flex items-center space-x-3 pb-3 border-b last:border-0 border-slate-100">
                      <div className={`w-9 h-9 ${activity.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${activity.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                        <p className="text-xs truncate text-slate-500">{activity.description}</p>
                      </div>
                      <span className="text-xs flex-shrink-0 text-slate-400">{activity.time}</span>
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
              className="backdrop-blur-xl rounded-xl p-6 shadow-lg border bg-white/80 border-white/60 shadow-blue-500/5"
            >
              <h3 className="text-lg font-semibold mb-4 text-slate-900">Quick Actions</h3>
              <div className="space-y-2">
                {quickActions.map((action, index) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.title)}
                      className="w-full flex items-center space-x-3 p-3 text-left rounded-lg transition-all group hover:bg-blue-50"
                    >
                      <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-slate-900">{action.title}</span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Broker Modal */}
      {isBrokerModalOpen && (
        <BrokerModal
          broker={null}
          isOpen={isBrokerModalOpen}
          onClose={() => setIsBrokerModalOpen(false)}
          onSubmit={async (data) => {
            await createBrokerMutation.mutateAsync(data as CreateBrokerData)
          }}
          isLoading={createBrokerMutation.isLoading}
        />
      )}

      {/* Group Modal */}
      {isGroupModalOpen && (
        <GroupModal
          group={null}
          isOpen={isGroupModalOpen}
          onClose={() => setIsGroupModalOpen(false)}
          onSubmit={async (data) => {
            await createGroupMutation.mutateAsync(data as CreateGroupData)
          }}
          isLoading={createGroupMutation.isLoading}
        />
      )}
    </div>
  )
}

export default Dashboard

