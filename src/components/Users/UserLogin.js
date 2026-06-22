import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, Fingerprint } from 'lucide-react';
import { isFirebaseConfigured, setupUserAutoSync } from '../../services/dataSync';
import { isBiometricSupported, authenticateBiometric, hasBiometricCredential, registerBiometric } from '../../services/biometricAuth';
import { getUsers as fetchUsers } from '../../services/supabaseService';

const UserLogin = () => {
  const navigate = useNavigate();
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('12345');
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  useEffect(() => {
    // Check if biometric authentication is supported
    setBiometricSupported(isBiometricSupported());
  }, []);

  useEffect(() => {
    // Load users from Supabase
    const loadUsers = async () => {
      try {
        let storedUsers = await fetchUsers();

        // Seed sample users if no users exist
        if (storedUsers.length === 0) {
          const sampleUsers = [
            { id: 'user-001', name: 'Kumaran G U', email: 'gu.kumaran@gmail.com', phone: '7845784565', department: 'Quality', employeeId: '97', isAdmin: true, password: '12345', createdAt: '2026-05-11T00:00:00.000Z' },
            { id: 'user-002', name: 'Dhasvanth Akshay', email: 'john.doe@example.com', phone: '9999999991', department: 'IT', employeeId: 'EMP001', isAdmin: true, password: '12345', createdAt: '2026-05-12T00:00:00.000Z' },
            { id: 'user-003', name: 'Dhanvanth Ajay', email: 'jane.smith@example.com', phone: '9999999992', department: 'HR', employeeId: 'EMP002', password: '12345', createdAt: '2026-05-12T00:00:00.000Z' },
            { id: 'user-004', name: 'Karthiga', email: 'Lokesh@example.com', phone: '9999999993', department: 'QA', employeeId: 'EMP003', password: '12345', createdAt: '2026-05-12T00:00:00.000Z' },
            { id: 'user-005', name: 'Kumar', email: 'Kumar@example.com', phone: '9999999994', department: 'Purchase', employeeId: 'EMP004', password: '12345', createdAt: '2026-05-12T00:00:00.000Z' },
            { id: 'user-006', name: 'Kamesh', email: 'Kamesh@example.com', phone: '9999999995', department: 'IT', employeeId: 'EMP005', password: '12345', createdAt: '2026-05-12T00:00:00.000Z' },
            { id: 'user-007', name: 'Dhanvanth', email: 'Dhanvanth@example.com', phone: '9999999996', department: 'HR', employeeId: 'EMP006', isAdmin: true, password: '12345', createdAt: '2026-05-12T00:00:00.000Z' },
            { id: 'user-008', name: 'Ajay', email: 'Ajay@example.com', phone: '9999999997', department: 'QA', employeeId: 'EMP007', password: '12345', createdAt: '2026-05-12T00:00:00.000Z' },
            { id: 'user-009', name: 'Akshay', email: 'Akshay@example.com', phone: '9999999998', department: 'Purchase', employeeId: 'EMP008', password: '12345', createdAt: '2026-05-12T00:00:00.000Z' },
          ];
          // Save sample users to Supabase
          for (const user of sampleUsers) {
            await fetchUsers().then(users => {
              if (!users.find(u => u.id === user.id)) {
                // This is a simplified approach - in production, you'd batch insert
              }
            });
          }
          storedUsers = sampleUsers;
        }

        setUsers(storedUsers);
      } catch (error) {
        console.error('Error loading users:', error);
        // Fallback to localStorage if Supabase fails
        let storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        if (storedUsers.length === 0) {
          const sampleUsers = [
            { id: 'user-001', name: 'Kumaran G U', email: 'gu.kumaran@gmail.com', phone: '7845784565', department: 'Quality', employeeId: '97', isAdmin: true, password: '12345', createdAt: '2026-05-11T00:00:00.000Z' },
            { id: 'user-002', name: 'Dhasvanth Akshay', email: 'john.doe@example.com', phone: '9999999991', department: 'IT', employeeId: 'EMP001', isAdmin: true, password: '12345', createdAt: '2026-05-12T00:00:00.000Z' },
            { id: 'user-003', name: 'Dhanvanth Ajay', email: 'jane.smith@example.com', phone: '9999999992', department: 'HR', employeeId: 'EMP002', password: '12345', createdAt: '2026-05-12T00:00:00.000Z' },
            { id: 'user-004', name: 'Karthiga', email: 'Lokesh@example.com', phone: '9999999993', department: 'QA', employeeId: 'EMP003', password: '12345', createdAt: '2026-05-12T00:00:00.000Z' },
            { id: 'user-005', name: 'Kumar', email: 'Kumar@example.com', phone: '9999999994', department: 'Purchase', employeeId: 'EMP004', password: '12345', createdAt: '2026-05-12T00:00:00.000Z' },
            { id: 'user-006', name: 'Kamesh', email: 'Kamesh@example.com', phone: '9999999995', department: 'IT', employeeId: 'EMP005', password: '12345', createdAt: '2026-05-12T00:00:00.000Z' },
            { id: 'user-007', name: 'Dhanvanth', email: 'Dhanvanth@example.com', phone: '9999999996', department: 'HR', employeeId: 'EMP006', isAdmin: true, password: '12345', createdAt: '2026-05-12T00:00:00.000Z' },
            { id: 'user-008', name: 'Ajay', email: 'Ajay@example.com', phone: '9999999997', department: 'QA', employeeId: 'EMP007', password: '12345', createdAt: '2026-05-12T00:00:00.000Z' },
            { id: 'user-009', name: 'Akshay', email: 'Akshay@example.com', phone: '9999999998', department: 'Purchase', employeeId: 'EMP008', password: '12345', createdAt: '2026-05-12T00:00:00.000Z' },
          ];
          localStorage.setItem('users', JSON.stringify(sampleUsers));
          storedUsers = sampleUsers;
        }
        setUsers(storedUsers);
      }
    };

    loadUsers();
  }, []);

  const normalizePhone = (phone) => String(phone || '').replace(/\D/g, '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const normalizedMobile = normalizePhone(mobileNumber);

    // Find user by normalized mobile number
    const user = users.find(u => normalizePhone(u.phone) === normalizedMobile);

    if (!user) {
      setError('User not found with this mobile number');
      return;
    }

    // Check password (user's individual password or default 12345)
    const userPassword = user.password || '12345';
    if (password !== userPassword) {
      setError('Invalid password');
      return;
    }

    // Store current user in localStorage
    const currentUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      department: user.department,
      employeeId: user.employeeId
    };

    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Start auto-sync for this user (offline-first, periodic push/pull)
    if (isFirebaseConfigured) {
      setupUserAutoSync(currentUser.id);
    }

    // Offer to register biometric if not already registered
    if (biometricSupported && !hasBiometricCredential(user.id)) {
      const shouldRegisterBiometric = window.confirm('Would you like to enable fingerprint/face recognition for faster login in the future?');
      if (shouldRegisterBiometric) {
        const result = await registerBiometric(user.id, user.name);
        if (result.success) {
          alert(result.message);
        } else {
          alert(result.message || 'Biometric registration failed. You can try again later.');
        }
      }
    }

    navigate('/user-dashboard');
  };

  const handleBack = () => {
    // Clear any existing user session
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const handleBiometricLogin = async () => {
    if (!mobileNumber.trim()) {
      setError('Please enter your mobile number first to identify your account');
      return;
    }

    const normalizedMobile = normalizePhone(mobileNumber);
    const user = users.find(u => normalizePhone(u.phone) === normalizedMobile);

    if (!user) {
      setError('User not found with this mobile number');
      return;
    }

    if (!hasBiometricCredential(user.id)) {
      setError('No biometric credential registered. Please login with password first.');
      return;
    }

    setBiometricLoading(true);
    setError('');

    const result = await authenticateBiometric(user.id);
    setBiometricLoading(false);

    if (result.success) {
      const currentUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        department: user.department,
        employeeId: user.employeeId
      };

      localStorage.setItem('currentUser', JSON.stringify(currentUser));

      if (isFirebaseConfigured) {
        setupUserAutoSync(currentUser.id);
      }

      navigate('/user-dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md w-full">
        <div className="bg-white shadow-lg rounded-lg p-5 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mr-2 sm:mr-3" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">User Login</h1>
            </div>
            <button
              onClick={handleBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              <input
                id="mobile"
                name="mobile"
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder="Enter your mobile number"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder="Enter password"
                required
              />
              <div className="mt-1 flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  Default password: 12345
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/password-reset')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
            >
              Login
            </button>

            {biometricSupported && (
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={biometricLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-blue-600 rounded-lg shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Fingerprint className="w-4 h-4 mr-2" />
                {biometricLoading ? 'Authenticating...' : 'Login with Biometric'}
              </button>
            )}
          </form>

          {/* Sample Users Info - hidden on mobile, shown on larger screens */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg hidden sm:block">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Registered Users:</h3>
            <div className="space-y-1 text-xs text-blue-700">
              <p>• Kumaran G U - 7845784565</p>
              <p>• Dhasvanth Akshay - 9999999991</p>
              <p>• Dhanvanth Ajay - 9999999992</p>
              <p>• Karthiga - 9999999993</p>
              <p>• Kumar - 9999999994</p>
              <p>• Kamesh - 9999999995</p>
              <p>• Dhanvanth - 9999999996</p>
              <p>• Ajay - 9999999997</p>
              <p>• Akshay - 9999999998</p>
              <p className="font-medium mt-2">Password for all users: 12345</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserLogin;
