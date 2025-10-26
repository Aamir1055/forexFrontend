# Broker Edit Mode Improvements

## Summary
When editing a broker, the modal now shows Rights and Groups tabs directly with existing assignments pre-checked, instead of requiring profile selection first.

## Changes Made

### 1. **BrokerModal.tsx - Rights Tab**
- **Profile Dropdown**: Hidden in edit mode (only shown when creating new broker)
- **Header**: Shows "Broker Rights & Groups" when editing, "Assign Profile" when creating
- **Rights Display**: 
  - Edit mode: Shows all available rights with broker's existing rights checked
  - Create mode: Shows rights from selected profile
- **Checkbox State**: Uses `selectedRights` for edit, `editableRolePermissions` for create
- **Checkbox Handler**: Uses `handleRightToggle()` for edit, `handleRolePermissionToggle()` for create

### 2. **BrokerModal.tsx - Groups Tab**
- **Groups Display**:
  - Edit mode: Shows all available groups with broker's assigned groups checked
  - Create mode: Shows groups from selected profile
- **Checkbox State**: Uses `selectedGroups` for edit, `editableProfileGroups` for create
- **Checkbox Handler**: Uses `handleGroupToggle()` for edit, `handleProfileGroupToggle()` for create

### 3. **New Functions Added**
```typescript
// Toggle right in selected rights (for edit mode)
const handleRightToggle = (rightId: number) => {
  setSelectedRights(prev => 
    prev.includes(rightId)
      ? prev.filter(id => id !== rightId)
      : [...prev, rightId]
  )
}

// Toggle group in selected groups (for edit mode)
const handleGroupToggle = (groupId: number) => {
  setSelectedGroups(prev => 
    prev.includes(groupId)
      ? prev.filter(id => id !== groupId)
      : [...prev, groupId]
  )
}
```

### 4. **New Query Added**
```typescript
// Fetch broker's current groups if editing
const { data: brokerGroups } = useQuery(
  ['broker-groups', broker?.id],
  () => brokerGroupMappingService.getBrokerGroupMappings(broker!.id),
  {
    enabled: !!broker?.id
  }
)
```

### 5. **useEffect Updated**
```typescript
useEffect(() => {
  if (broker) {
    // ... form data setup ...
    
    // Set selected rights for existing broker
    setSelectedRights(brokerRights?.map(right => right.id) || [])
    // Set selected groups for existing broker
    setSelectedGroups(brokerGroups?.map(group => group.group_id) || [])
  } else {
    // ... reset form ...
    setSelectedRights([])
    setSelectedGroups([])
  }
}, [broker, brokerRights, brokerGroups])
```

## User Experience

### Before:
1. Click Edit on a broker
2. Modal opens to "Basic Information" tab
3. Navigate to "Assign Profile" tab
4. Must select a profile from dropdown to see any rights/groups
5. Doesn't show broker's actual current assignments

### After:
1. Click Edit on a broker
2. Modal opens directly to "Broker Rights & Groups" tab
3. All available rights are shown with broker's existing rights pre-checked
4. Can switch to Groups sub-tab to see all groups with broker's groups pre-checked
5. No profile dropdown - edit the assignments directly
6. Changes are saved when clicking "Update Broker"

## Testing
1. Go to Broker Management: http://185.136.159.142/brk-eye-adm/
2. Click Edit on any broker
3. Modal should open to "Broker Rights & Groups" tab
4. Rights sub-tab should show all rights with broker's rights checked
5. Groups sub-tab should show all groups with broker's groups checked
6. Toggle some rights/groups on/off
7. Click "Update Broker"
8. Changes should be saved to the database

## Deployment
- Built: ✅ `npm run build`
- Deployed: ✅ Copied to `C:\xampp\htdocs\brk-eye-adm\`
- Git: ✅ Committed and pushed to GitHub

## Related Files
- `src/components/BrokerModal.tsx` - Main modal component
- `src/services/brokerGroupMappingService.ts` - Broker group mapping API
- `src/services/brokerRightsService.ts` - Broker rights API
