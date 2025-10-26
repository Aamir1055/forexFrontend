import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const UIEnhancementNotification: React.FC = () => {
  const navigate = useNavigate()
  
  useEffect(() => {
    // Show notification about UI enhancements
    const hasShownNotification = localStorage.getItem('uiEnhancementNotificationShown')
    if (!hasShownNotification) {
      setTimeout(() => {
        toast.custom((t) => (
          <AnimatePresence>
            {t.visible && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-2xl shadow-2xl max-w-md mx-auto border border-blue-500/20"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">🎉 UI Enhanced!</h3>
                    <p className="text-blue-100 text-sm mb-3">
                      Your application now features:
                    </p>
                    <ul className="text-blue-100 text-sm space-y-1">
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Tabbed broker creation with permissions
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Compact role permission grids
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Modern animations & design
                      </li>
                    </ul>
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => {
                          toast.dismiss(t.id)
                          localStorage.setItem('uiEnhancementNotificationShown', 'true')
                        }}
                        className="px-4 py-2 bg-white/20 text-white rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
                      >
                        Got it!
                      </button>
                      <button
                        onClick={() => {
                          toast.dismiss(t.id)
                          navigate('/brokers')
                        }}
                        className="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                      >
                        Try Broker Creation
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        ), {
          duration: 10000,
          position: 'top-center'
        })
        localStorage.setItem('uiEnhancementNotificationShown', 'true')
      }, 2000)
    }
  }, [])

  return null
}

export default UIEnhancementNotification