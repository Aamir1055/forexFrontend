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
      className={`bg-white rounded-lg border ${colors.border} shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden`}
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors.bg} flex items-center justify-center shadow-md`}>
            <div className="text-white">
              {icon}
            </div>
          </div>
          {trend && (
            <div className={`flex items-center space-x-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
              trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </div>
          )}
        </div>
        <div>
          <p className="text-[9px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">
            {title}
          </p>
          <p className="text-lg font-bold text-gray-900 mb-0.5 leading-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-[10px] text-gray-600 leading-tight">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default StatCard
