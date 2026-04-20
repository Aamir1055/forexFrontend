import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  pulse?: boolean
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  pulse = false
}) => {
  const baseStyles = "inline-flex items-center font-medium rounded-full transition-all duration-200"
  
  const variants = {
    default: "bg-gray-100 text-gray-800 border border-gray-200",
    success: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    warning: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    danger: "bg-red-100 text-red-800 border border-red-200",
    info: "bg-blue-100 text-blue-800 border border-blue-200",
    purple: "bg-purple-100 text-purple-800 border border-purple-200"
  }
  
  const sizes = {
    xs: "px-1.5 py-0.5 text-[10px]",
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base"
  }

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        pulse && "animate-pulse",
        className
      )}
    >
      {children}
    </motion.span>
  )
}

export default Badge

