import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, BookOpen, ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { sendOTP, verifyOTP, getOTPRemainingTime } from '../../services/emailOtpService';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Step 1: Email, Step 2: OTP, Step 3: Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState(''); // Store generated OTP for display
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);
  const [adminUsers, setAdminUsers] = useState([]);

  const initializeSuperAdmin = () => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if super admin already exists
    const existingSuperAdmin = users.find(u => u.email === 'vibro.chennai@gmail.com');
    if (existingSuperAdmin) {
      alert('Super admin already exists');
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
    
    // Remove Admin123 password from all users
    users.forEach(user => {
      if (user.password === 'Admin123') {
        delete user.password;
      }
    });
    localStorage.setItem('users', JSON.stringify(users));
    
    alert('Super admin created successfully!\nEmail: vibro.chennai@gmail.com\nLogin with this email using OTP');
    window.location.reload();
  };

  useEffect(() => {
    // Load all users to check if email is admin
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const admins = users.filter(u => u.isAdmin === true);
    setAdminUsers(admins);
  }, []);

  // Timer for OTP expiry
  useEffect(() => {
    if (step === 2 && email) {
      const interval = setInterval(() => {
        const remaining = getOTPRemainingTime(email);
        setRemainingTime(remaining);
        if (remaining === 0) {
          clearInterval(interval);
          setStep(1);
          setOtp('');
          setError('OTP expired. Please request a new OTP.');
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, email]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Check if this is super admin email
    if (email === 'vibro.chennai@gmail.com') {
      setStep(3); // Go to password step
      setMessage('Super Admin detected. Please enter your password.');
      return;
    }

    // Check if user with this email is an admin
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const adminUser = users.find(u => u.email === email && u.isAdmin === true);

    if (!adminUser) {
      setError('This email is not registered as an admin. Only admins can login here.');
      return;
    }

    setLoading(true);
    const result = await sendOTP(email, adminUser.name);
    setLoading(false);

    if (result.success) {
      setStep(2);
      setGeneratedOTP(result.otp || ''); // Store OTP for display
      setMessage(result.message);
      setError('');
    } else {
      setError(result.message);
    }
  };

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    const result = verifyOTP(email, otp);

    if (result.success) {
      // Find the admin user and login
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const adminUser = users.find(u => u.email === email && u.isAdmin === true);

      if (adminUser) {
        const currentUser = {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          phone: adminUser.phone,
          department: adminUser.department,
          employeeId: adminUser.employeeId,
          isAdmin: true,
          isSuperAdmin: adminUser.isSuperAdmin || false,
          moduleAccess: adminUser.moduleAccess || {}
        };

        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('currentAdmin', JSON.stringify(currentUser));
        
        setMessage('Login successful! Redirecting...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      }
    } else {
      setError(result.message);
    }
  };

  const handlePasswordLogin = (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    if (password === 'Vibro@123') {
      // Login as super admin
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const superAdmin = users.find(u => u.email === 'vibro.chennai@gmail.com');

      if (superAdmin) {
        const currentUser = {
          id: superAdmin.id,
          name: superAdmin.name,
          email: superAdmin.email,
          phone: superAdmin.phone,
          department: superAdmin.department,
          employeeId: superAdmin.employeeId,
          isAdmin: true,
          isSuperAdmin: true,
          moduleAccess: superAdmin.moduleAccess || {}
        };

        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('currentAdmin', JSON.stringify(currentUser));
        
        setMessage('Login successful! Redirecting...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        setError('Super admin not found. Please initialize super admin first.');
      }
    } else {
      setError('Invalid password');
    }
  };

  const handleBack = () => {
    if (step === 2 || step === 3) {
      setStep(1);
      setOtp('');
      setPassword('');
      setError('');
      setMessage('');
      setRemainingTime(0);
    } else {
      navigate('/login');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">L&D Software</h1>
          <p className="text-gray-600 mt-2">Admin Login with OTP</p>
        </div>

        {/* Step 1: Email */}
        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="admin@example.com"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-600">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </button>
          </form>
        ) : step === 3 ? (
          // Step 3: Password for Super Admin
          <form onSubmit={handlePasswordLogin} className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                Super Admin Login for <span className="font-semibold">{email}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-600">{message}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition duration-200 flex items-center justify-center"
            >
              Login as Super Admin
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setPassword('');
                setError('');
              }}
              className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300 transition duration-200"
            >
              Use Different Email
            </button>
          </form>
        ) : (
          // Step 2: OTP Verification
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                OTP has been sent to <span className="font-semibold">{email}</span>
              </p>
              {generatedOTP && (
                <div className="mt-2 p-2 bg-white border border-blue-300 rounded">
                  <p className="text-xs text-blue-600 mb-1">Your OTP (for testing):</p>
                  <p className="text-2xl font-bold text-blue-900 tracking-widest">{generatedOTP}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength="6"
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-center text-2xl tracking-widest"
                  placeholder="000000"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                OTP expires in: {formatTime(remainingTime)}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-600">{message}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 flex items-center justify-center"
            >
              Verify OTP
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOtp('');
                setError('');
              }}
              className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300 transition duration-200"
            >
              Use Different Email
            </button>
          </form>
        )}

        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={handleBack}
            className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          <a href="/user-login" className="text-blue-600 hover:text-blue-800 text-sm font-medium transition duration-200">
            User Login →
          </a>
        </div>

        {/* Admin Users Info */}
        {adminUsers.length > 0 && (
          <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <h3 className="text-sm font-semibold text-indigo-900 mb-2">Admin Accounts:</h3>
            <div className="space-y-1">
              {adminUsers.map((admin) => (
                <div key={admin.id} className="text-xs text-indigo-700">
                  <p>• {admin.name}</p>
                  <p className="text-indigo-600 ml-3">{admin.email}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Initialize Super Admin Button */}
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-sm font-semibold text-red-900 mb-2">Initialize Super Admin</h3>
          <p className="text-xs text-red-700 mb-3">
            Click this button to create the Super Admin account with email: vibro.chennai@gmail.com
          </p>
          <button
            onClick={initializeSuperAdmin}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
          >
            Initialize Super Admin
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
