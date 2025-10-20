import React, { useState } from 'react'
import RoleModal from './RoleModal'

// Test component to verify modal changes
const ModalTest: React.FC = () => {
  const [showRoleModal, setShowRoleModal] = useState(false)

  const mockPermissions = [
    { id: 1, permission_id: 1, name: 'Read Users', description: 'Can view users', category: 'users', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, permission_id: 2, name: 'Write Users', description: 'Can create/edit users', category: 'users', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 3, permission_id: 3, name: 'Delete Users', description: 'Can delete users', category: 'users', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  ]

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold">Modal Test Page</h2>
      <p className="text-gray-600">Click the button below to test the enhanced modal:</p>
      
      <div className="space-x-4">
        <button
          onClick={() => setShowRoleModal(true)}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          🧪 Test Enhanced RoleModal
        </button>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-bold text-yellow-800">What to Look For:</h3>
        <ul className="mt-2 text-sm text-yellow-700 space-y-1">
          <li>• RoleModal: Purple-indigo gradient header, two-column layout, animated circles</li>
          <li>• Enhanced styling and smooth animations</li>
        </ul>
      </div>

      {/* Test Modal */}
      <RoleModal
        role={null}
        permissions={mockPermissions}
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onSubmit={() => {}}
        isLoading={false}
      />
    </div>
  )
}

export default ModalTest