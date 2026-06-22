import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import { sendMobileOTP, verifyMobileOTP, getMobileOTPRemainingTime } from '../../services/mobileOtpService';

const PasswordReset = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Step 1: Mobile, Step 2: OTP, Step 3: New Password
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);
  const [user, setUser] = useState(null);

  // Timer for OTP expiry
  useEffect(() => {
    if (step === 2 && mobileNumber) {
      const interval = setInterval(() => {
        const remaining = getMobileOTPRemainingTime(mobileNumber);
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
  }, [step, mobileNumber]);

  const normalizePhone = (phone) => String(phone || '').replace(/\D/g, '');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!mobileNumber.trim()) {
      setError('Please enter your mobile number');
      return;
    }

    const normalizedMobile = normalizePhone(mobileNumber);

    // Check if user with this mobile number exists
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = users.find(u => normalizePhone(u.phone) === normalizedMobile);

    if (!foundUser) {
      setError('User not found with this mobile number');
      return;
    }

    setUser(foundUser);
    setLoading(true);
    const result = await sendMobileOTP(normalizedMobile, foundUser.name);
    setLoading(false);

    if (result.success) {
      setStep(2);
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

    const result = verifyMobileOTP(normalizePhone(mobileNumber), otp);

    if (result.success) {
      setStep(3);
      setMessage('OTP verified. Please set your new password.');
      setError('');
    } else {
      setError(result.message);
    }
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      // Update user password in localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = users.map(u => {
        if (u.id === user.id) {
          return { ...u, password: newPassword };
        }
        return u;
      });

      localStorage.setItem('users', JSON.stringify(updatedUsers));

      setMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/user-login');
      }, 2000);
    } catch (error) {
      setError('Failed to reset password. Please try again.');
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setOtp('');
      setError('');
      setMessage('');
      setRemainingTime(0);
    } else if (step === 3) {
      setStep(2);
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    } else {
      navigate('/user-login');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md w-full">
        <div className="bg-white shadow-lg rounded-lg p-5 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center">
              <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mr-2 sm:mr-3" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Password Reset</h1>
            </div>
            <button
              onClick={handleBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Step 1: Mobile Number */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-4 sm:space-y-6">
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
                  placeholder="Enter your registered mobile number"
                  required
                />
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
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
                {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-4 sm:space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  OTP has been sent to <span className="font-semibold">{mobileNumber}</span>
                </p>
              </div>

              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength="6"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                  placeholder="000000"
                  required
                />
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
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
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
                Use Different Mobile Number
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4 sm:space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <p className="text-sm text-green-800">OTP verified successfully</p>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="Enter new password (min 6 characters)"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="Confirm new password"
                  required
                />
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
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
              >
                Reset Password
                <CheckCircle className="w-4 h-4 ml-2" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;
