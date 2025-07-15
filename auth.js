// Authentication services for LVL3.ai Sales Portal
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseInitialized } from './firebase.js';

// Register a new user
export const registerUser = async (email, password) => {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    console.log('Firebase not initialized, using mock mode');
    // Return mock successful response for demo purposes
    return { 
      success: true, 
      user: { 
        uid: 'mock-user-id', 
        email,
        displayName: email.split('@')[0]
      },
      mockMode: true
    };
  }

  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Add user document to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email,
      createdAt: serverTimestamp(),
      salesLinks: []
    });
    
    return { success: true, user };
  } catch (error) {
    console.error('Registration error:', error.message);
    return { success: false, error: error.message };
  }
};

// Log in an existing user
export const loginUser = async (email, password) => {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    console.log('Firebase not initialized, using mock mode');
    // Return mock successful response for demo purposes
    return { 
      success: true, 
      user: { 
        uid: 'mock-user-id', 
        email, 
        displayName: email.split('@')[0]
      },
      mockMode: true
    };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Login error:', error.message);
    return { success: false, error: error.message };
  }
};

// Log out the current user
export const logoutUser = async () => {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    console.log('Firebase not initialized, using mock mode');
    return { success: true, mockMode: true };
  }

  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error.message);
    return { success: false, error: error.message };
  }
};

// Get the current authenticated user
export const getCurrentUser = () => {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    console.log('Firebase not initialized, using mock mode');
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

// Get user profile data
export const getUserProfile = async (userId) => {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    console.log('Firebase not initialized, using mock mode');
    // Return mock data for demo purposes
    return { 
      success: true, 
      data: {
        email: 'demo@lvl3.ai',
        createdAt: new Date().toISOString(),
        salesLinks: [
          {
            id: 'mock-link-id',
            url: `${window.location.origin}?ref=mock-link-id`,
            createdAt: new Date().toISOString(),
            clicks: 24,
            conversions: 5
          }
        ]
      },
      mockMode: true
    };
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    } else {
      return { success: false, error: 'User profile not found' };
    }
  } catch (error) {
    console.error('Get profile error:', error.message);
    return { success: false, error: error.message };
  }
};
