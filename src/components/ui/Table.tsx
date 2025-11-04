import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface TableProps {
  children: React.ReactNode
  className?: string
}

interface TableHeaderProps {
  children: React.ReactNode
  className?: string
}

interface TableBodyProps {
  children: React.ReactNode
  className?: string
}

interface TableRowProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

interface TableCellProps {
  children: React.ReactNode
  className?: string
  header?: boolean
}

const Table: React.FC<TableProps> = ({ children, className }) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
      <div className="overflow-x-auto">
        <table className={cn("w-full", className)}>
          {children}
        </table>
      </div>
    </div>
  )
}

const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => {
  return (
    <thead className={cn("bg-gradient-to-r from-gray-50 to-gray-100", className)}>
      {children}
    </thead>
  )
}

const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  return (
    <tbody className={cn("divide-y divide-gray-200", className)}>
      {children}
    </tbody>
  )
}

const TableRow: React.FC<TableRowProps> = ({ 
  children, 
  className, 
  hover = true, 
  onClick 
}) => {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={hover ? { backgroundColor: 'rgba(59, 130, 246, 0.05)' } : undefined}
      className={cn(
        "transition-colors duration-200",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </motion.tr>
  )
}

const TableCell: React.FC<TableCellProps> = ({ 
  children, 
  className, 
  header = false 
}) => {
  const Component = header ? 'th' : 'td'
  
  return (
    <Component
      className={cn(
        "px-6 py-4 text-left",
        header 
          ? "text-xs font-semibold text-gray-700 uppercase tracking-wider" 
          : "text-sm text-gray-900",
        className
      )}
    >
      {children}
    </Component>
  )
}

export { Table, TableHeader, TableBody, TableRow, TableCell }

