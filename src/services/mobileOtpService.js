// Mobile OTP Service for Password Reset
// This service simulates SMS sending for OTP authentication
// In production, replace with actual SMS API (Twilio, AWS SNS, etc.)

const MOBILE_CONFIG = {
  otpExpiry: 5 * 60 * 1000, // 5 minutes
};

// Store OTPs in memory (in production, use a database)
const otpStore = {};

/**
 * Generate a random 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP to user's mobile number (simulated)
 * In production, integrate with SMS service like Twilio, AWS SNS, or MSG91
 */
export const sendMobileOTP = async (mobileNumber, userName) => {
  try {
    const otp = generateOTP();
    const expiryTime = Date.now() + MOBILE_CONFIG.otpExpiry;

    // Store OTP with expiry
    otpStore[mobileNumber] = {
      otp,
      expiryTime,
      attempts: 0,
      maxAttempts: 5
    };

    // Save to localStorage for development testing
    if (process.env.NODE_ENV === 'development') {
      const devOtps = JSON.parse(localStorage.getItem('__devMobileOTPs__') || '{}');
      devOtps[mobileNumber] = otp;
      localStorage.setItem('__devMobileOTPs__', JSON.stringify(devOtps));
    }

    // In a real application, you would call your SMS API here
    // Example: await sendSMS({
    //   to: mobileNumber,
    //   message: `Your OTP is: ${otp}`
    // });

    return {
      success: true,
      message: `OTP sent to ${mobileNumber}.`
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to send OTP. Please try again.'
    };
  }
};

/**
 * Verify OTP
 */
export const verifyMobileOTP = (mobileNumber, providedOtp) => {
  if (!otpStore[mobileNumber]) {
    return {
      success: false,
      message: 'No OTP found for this mobile number. Please request a new OTP.'
    };
  }

  const otpData = otpStore[mobileNumber];

  // Check if OTP has expired
  if (Date.now() > otpData.expiryTime) {
    delete otpStore[mobileNumber];
    return {
      success: false,
      message: 'OTP has expired. Please request a new OTP.'
    };
  }

  // Check max attempts
  if (otpData.attempts >= otpData.maxAttempts) {
    delete otpStore[mobileNumber];
    return {
      success: false,
      message: 'Maximum OTP verification attempts exceeded. Please request a new OTP.'
    };
  }

  // Verify OTP
  if (otpData.otp === providedOtp) {
    delete otpStore[mobileNumber]; // Remove OTP after successful verification
    return {
      success: true,
      message: 'OTP verified successfully.'
    };
  }

  // Increment attempts
  otpData.attempts += 1;
  return {
    success: false,
    message: `Invalid OTP. ${otpData.maxAttempts - otpData.attempts} attempts remaining.`
  };
};

/**
 * Get remaining time for OTP
 */
export const getMobileOTPRemainingTime = (mobileNumber) => {
  if (!otpStore[mobileNumber]) return 0;
  
  const remaining = otpStore[mobileNumber].expiryTime - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
};

/**
 * Clear OTP for mobile number (useful for logout)
 */
export const clearMobileOTP = (mobileNumber) => {
  if (otpStore[mobileNumber]) {
    delete otpStore[mobileNumber];
  }
};

/**
 * Get OTP for testing (development only - remove in production)
 */
export const getMobileOTPForTesting = (mobileNumber) => {
  return otpStore[mobileNumber]?.otp || null;
};

const mobileOtpService = {
  sendMobileOTP,
  verifyMobileOTP,
  getMobileOTPRemainingTime,
  clearMobileOTP,
  getMobileOTPForTesting
};

export default mobileOtpService;
