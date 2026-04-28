
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { PermissionProvider } from './contexts/PermissionContext'
import Login from './pages/Login'
import Users from './pages/Users'
import Roles from './pages/Roles'
import Brokers from './pages/Brokers'
import BrokerProfiles from './pages/BrokerProfiles'
import Groups from './pages/Groups'
import Rules from './pages/Rules'
import Settings from './pages/Settings'
import AuditLogs from './pages/AuditLogs'
import Logs from './pages/Logs'
import ApiMetrics from './pages/ApiMetrics'

import ModalTest from './components/ModalTest'
import Dashboard from './pages/Dashboard'
import CreateBroker from './pages/CreateBroker'



function App() {
    return (
        <PermissionProvider>
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
                                        <Route path="/rules" element={<Rules />} />
                                        <Route path="/audit-logs" element={<AuditLogs />} />
                                        <Route path="/logs" element={<Logs />} />
                                        <Route path="/api-metrics" element={<ApiMetrics />} />

                                        <Route path="/settings" element={<Settings />} />
                                        <Route path="/modal-test" element={<ModalTest />} />
                                        <Route path="/create-broker" element={<CreateBroker />} />
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
                        background: '#ffffff',
                        color: '#0f172a',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                        fontSize: '14px',
                        fontWeight: '500',
                    },
                    success: {
                        iconTheme: {
                            primary: '#1d4ed8',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />
        </PermissionProvider>
    )
}

export default App

