
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Users from './pages/Users'
import Roles from './pages/Roles'
import Brokers from './pages/Brokers'
import BrokerProfiles from './pages/BrokerProfiles'
import Groups from './pages/Groups'
import Settings from './pages/Settings'
import AuditLogs from './pages/AuditLogs'
import Logs from './pages/Logs'

import ModalTest from './components/ModalTest'
import Dashboard from './pages/Dashboard'



function App() {
    return (
        <>
            <AnimatePresence mode="wait">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/*" element={
                        <ProtectedRoute>
                            <Layout>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="min-h-full"
                                >
                                    <Routes>
                                        <Route path="/" element={<Dashboard />} />
                                        <Route path="/users" element={<Users />} />
                                        <Route path="/roles" element={<Roles />} />
                                        <Route path="/brokers" element={<Brokers />} />
                                        <Route path="/broker-profiles" element={<BrokerProfiles />} />
                                        <Route path="/groups" element={<Groups />} />
                                        <Route path="/audit-logs" element={<AuditLogs />} />
                                        <Route path="/logs" element={<Logs />} />

                                        <Route path="/settings" element={<Settings />} />
                                        <Route path="/modal-test" element={<ModalTest />} />
                                    </Routes>
                                </motion.div>
                            </Layout>
                        </ProtectedRoute>
                    } />
                </Routes>
            </AnimatePresence>

            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    },
                    success: {
                        style: {
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        },
                    },
                    error: {
                        style: {
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        },
                    },
                }}
            />
        </>
    )
}

export default App