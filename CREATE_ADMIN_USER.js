/**
 * Script to create a new admin user with all roles and permissions
 * 
 * Instructions:
 * 1. Make sure you're logged in to the application
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 5. Follow the prompts
 */

(async function createAdminUser() {
  const API_BASE = 'http://185.136.159.142:8080/api';
  const token = localStorage.getItem('authToken');

  if (!token) {
    console.error('❌ No auth token found! Please login first.');
    return;
  }

  console.log('🚀 Starting admin user creation process...');

  try {
    // Step 1: Fetch all available roles
    console.log('📋 Step 1: Fetching all roles...');
    const rolesResponse = await fetch(`${API_BASE}/roles?include_permissions=true`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!rolesResponse.ok) {
      throw new Error(`Failed to fetch roles: ${rolesResponse.status}`);
    }

    const rolesData = await rolesResponse.json();
    const allRoles = rolesData.data.roles;
    const allRoleIds = allRoles.map(role => role.id);

    console.log('✅ Found roles:', allRoles.map(r => r.name).join(', '));
    console.log('📊 Total roles:', allRoleIds.length);
    console.log('🔑 Role IDs:', allRoleIds);

    // Step 2: Create the new user
    console.log('\n📝 Step 2: Creating new user...');
    
    const newUserData = {
      username: 'superadmin',
      email: 'superadmin@example.com',
      password: 'SuperAdmin@123',
      is_active: true,
      role_ids: allRoleIds  // Assign all roles
    };

    console.log('👤 New user details:');
    console.log('   Username:', newUserData.username);
    console.log('   Email:', newUserData.email);
    console.log('   Password:', newUserData.password);
    console.log('   Roles:', allRoleIds.length, 'roles assigned');

    const createResponse = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newUserData)
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(`Failed to create user: ${errorData.message || createResponse.status}`);
    }

    const userData = await createResponse.json();
    console.log('✅ User created successfully!');
    console.log('📄 Response:', userData);

    // Summary
    console.log('\n═══════════════════════════════════════════════════');
    console.log('🎉 SUCCESS! New admin user created!');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('📋 Login Credentials:');
    console.log('   Username: superadmin');
    console.log('   Password: SuperAdmin@123');
    console.log('   Email: superadmin@example.com');
    console.log('');
    console.log('🔐 Permissions: ALL (' + allRoleIds.length + ' roles assigned)');
    console.log('');
    console.log('⚠️  IMPORTANT:');
    console.log('   1. Save these credentials securely');
    console.log('   2. Change the password after first login');
    console.log('   3. This user has full admin access');
    console.log('');
    console.log('✨ You can now logout and login with these credentials!');
    console.log('═══════════════════════════════════════════════════');

    // Show alert
    alert(`✅ Admin user created successfully!\n\nUsername: superadmin\nPassword: SuperAdmin@123\n\nYou can now logout and login with these credentials.`);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    console.error('Error details:', error.message);
    alert(`❌ Failed to create admin user: ${error.message}`);
  }
})();
