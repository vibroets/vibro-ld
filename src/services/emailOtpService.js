// Email OTP Service
// This service simulates email sending for OTP authentication
// In production, replace with actual email API (Gmail, SendGrid, etc.)

const EMAIL_CONFIG = {
  senderEmail: 'vibro.chennai@gmail.com',
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
 * Send OTP to user's email (simulated)
 * In production, integrate with email service like SendGrid, AWS SES, or Gmail API
 */
export const sendOTP = async (email, userName) => {
  try {
    const otp = generateOTP();
    const expiryTime = Date.now() + EMAIL_CONFIG.otpExpiry;

    // Store OTP with expiry
    otpStore[email] = {
      otp,
      expiryTime,
      attempts: 0,
      maxAttempts: 5
    };

    // Save to localStorage for development testing
    if (process.env.NODE_ENV === 'development') {
      const devOtps = JSON.parse(localStorage.getItem('__devOTPs__') || '{}');
      devOtps[email] = otp;
      localStorage.setItem('__devOTPs__', JSON.stringify(devOtps));
    }

    // In a real application, you would call your email API here
    // Example: await sendEmail({
    //   to: email,
    //   from: EMAIL_CONFIG.senderEmail,
    //   subject: 'Your L&D Software Login OTP',
    //   body: `Your OTP is: ${otp}`
    // });

    return {
      success: true,
      message: `OTP sent to ${email}.`,
      otp: otp // Include OTP in response for development/testing
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
export const verifyOTP = (email, providedOtp) => {
  if (!otpStore[email]) {
    return {
      success: false,
      message: 'No OTP found for this email. Please request a new OTP.'
    };
  }

  const otpData = otpStore[email];

  // Check if OTP has expired
  if (Date.now() > otpData.expiryTime) {
    delete otpStore[email];
    return {
      success: false,
      message: 'OTP has expired. Please request a new OTP.'
    };
  }

  // Check max attempts
  if (otpData.attempts >= otpData.maxAttempts) {
    delete otpStore[email];
    return {
      success: false,
      message: 'Maximum OTP verification attempts exceeded. Please request a new OTP.'
    };
  }

  // Verify OTP
  if (otpData.otp === providedOtp) {
    delete otpStore[email]; // Remove OTP after successful verification
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
export const getOTPRemainingTime = (email) => {
  if (!otpStore[email]) return 0;
  
  const remaining = otpStore[email].expiryTime - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
};

/**
 * Clear OTP for email (useful for logout)
 */
export const clearOTP = (email) => {
  if (otpStore[email]) {
    delete otpStore[email];
  }
};

/**
 * Get OTP for testing (development only - remove in production)
 */
export const getOTPForTesting = (email) => {
  return otpStore[email]?.otp || null;
};

const emailOtpService = {
  sendOTP,
  verifyOTP,
  getOTPRemainingTime,
  clearOTP,
  getOTPForTesting
};

export default emailOtpService;
