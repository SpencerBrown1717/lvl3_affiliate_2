// Configuration and constants for LVL3.ai Sales Portal

// Sales program configuration
export const SALES_CONFIG = {
  // Payout per qualified signup in USD
  PAYOUT_PER_SIGNUP: 50,
  
  // Maximum payout per affiliate in USD
  MAX_PAYOUT_PER_AFFILIATE: 2500,
  
  // Maximum signups per affiliate
  MAX_SIGNUPS_PER_AFFILIATE: 50,
  
  // Global maximum number of qualified signups
  GLOBAL_MAX_SIGNUPS: 500,
  
  // Default commission rate (as decimal)
  DEFAULT_COMMISSION_RATE: 0.1
};

// Feature flags for enabling/disabling features
export const FEATURES = {
  OFFLINE_SUPPORT: true,
  PERSISTENT_NOTIFICATIONS: true,
  ENHANCED_ERROR_HANDLING: true,
  MOCK_MODE: true
};

// Error messages
export const ERROR_MESSAGES = {
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/email-already-in-use': 'This email is already registered.',
  'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
  'auth/invalid-email': 'Invalid email address format.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/popup-closed-by-user': 'Sign-in popup was closed before completing.',
  'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in credentials.',
  'firestore/permission-denied': 'You don\'t have permission to perform this action.',
  'firestore/unavailable': 'The Firestore service is temporarily unavailable.',
  'link/not-found': 'This sales link no longer exists or has been deactivated.',
  'link/already-processed': 'This click has already been processed.',
  'link/rate-limit': 'Too many clicks from the same source.',
  'signup/limit-reached': 'You have reached your maximum signup limit of 50.',
  'signup/global-limit-reached': 'The global signup limit of 500 has been reached.'
};

// Application settings
export const APP_SETTINGS = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  CACHE_DURATION_MS: 5 * 60 * 1000, // 5 minutes
  NOTIFICATION_TIMEOUT_MS: 5000
};

// Local storage keys
export const STORAGE_KEYS = {
  NOTIFICATIONS: 'lvl3_notifications',
  USER_CACHE: 'lvl3_user_cache',
  OFFLINE_QUEUE: 'lvl3_offline_queue',
  LINK_CACHE: 'lvl3_link_cache'
};
