import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  // Redirect to Admin OTP login since we use OTP-based authentication
  useEffect(() => {
    navigate('/admin-login');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to Admin OTP Login...</p>
      </div>
    </div>
  );
};

export default Login;
