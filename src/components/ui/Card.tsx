import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glass?: boolean
  gradient?: boolean
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  hover = false, 
  glass = false,
  gradient = false 
}) => {
  const baseStyles = "rounded-2xl border transition-all duration-300"
  
  const variants = {
    default: "bg-white border-gray-200 shadow-lg hover:shadow-xl",
    glass: "backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl",
    gradient: "bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-lg hover:shadow-xl"
  }
  
  const getVariant = () => {
    if (glass) return variants.glass
    if (gradient) return variants.gradient
    return variants.default
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -4, scale: 1.02 } : undefined}
      className={cn(
        baseStyles,
        getVariant(),
        className
      )}
    >
      {children}
    </motion.div>
  )
}

export default Card

