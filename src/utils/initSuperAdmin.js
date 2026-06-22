// Initialize Super Admin User
// Run this in browser console to create super admin

const initSuperAdmin = () => {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  
  // Check if super admin already exists
  const existingSuperAdmin = users.find(u => u.email === 'vibro.chennai@gmail.com');
  if (existingSuperAdmin) {
    console.log('Super admin already exists');
    return;
  }
  
  // Create super admin
  const superAdmin = {
    id: Date.now().toString(),
    name: 'Super Admin',
    email: 'vibro.chennai@gmail.com',
    phone: '9876543210',
    department: 'Management',
    employeeId: 'SA001',
    designation: 'management',
    isAdmin: true,
    isSuperAdmin: true,
    moduleAccess: {
      userModule: true,
      trainingSchedule: true,
      trainingCalendar: true,
      participantEnrollment: true,
      assessmentManagement: true,
      attendanceManagement: true,
      venueManagement: true,
      trainerManagement: true,
      approvalWorkflow: true,
      ltModule: true,
      trainingAnalytics: true,
      reports: true
    }
  };
  
  users.push(superAdmin);
  localStorage.setItem('users', JSON.stringify(users));
  
  console.log('Super admin created successfully!');
  console.log('Email: vibro.chennai@gmail.com');
  console.log('Password: Vibro@123 (if password-based login is enabled)');
  console.log('Note: Use OTP-based login with this email');
};

// Remove default Admin123 password from all admin users
const removeDefaultAdminPassword = () => {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  let updated = false;
  
  users.forEach(user => {
    if (user.password === 'Admin123') {
      delete user.password;
      updated = true;
    }
  });
  
  if (updated) {
    localStorage.setItem('users', JSON.stringify(users));
    console.log('Default Admin123 password removed from admin users');
  } else {
    console.log('No users with Admin123 password found');
  }
};

// Run initialization
console.log('=== Super Admin Initialization ===');
initSuperAdmin();
removeDefaultAdminPassword();
console.log('=== Initialization Complete ===');
