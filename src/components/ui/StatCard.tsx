import React from 'react'
import { motion } from 'framer-motion'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: {
    value: string
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'red'
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  color = 'blue'
}) => {
  const colorClasses = {
    blue: {
      bg: 'from-blue-500 to-blue-600',
      light: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200'
    },
    green: {
      bg: 'from-green-500 to-green-600',
      light: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200'
    },
    purple: {
      bg: 'from-purple-500 to-purple-600',
      light: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200'
    },
    amber: {
      bg: 'from-amber-500 to-amber-600',
      light: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200'
    },
    red: {
      bg: 'from-red-500 to-red-600',
      light: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200'
    }
  }

  const colors = colorClasses[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-xl border ${colors.border} shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden`}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center shadow-lg`}>
            <div className="text-white">
              {icon}
            </div>
          </div>
          {trend && (
            <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-full ${
              trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <span className="text-xs font-semibold">
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default StatCard
