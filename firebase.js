// Firebase configuration for LVL3.ai Sales Portal
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Import configuration
import { firebaseConfig } from './firebase.config.js';

// Initialize Firebase with defensive coding
let app, auth, db, functions;
let firebaseInitialized = false;

try {
  // Check if we have valid config
  if (
    firebaseConfig && 
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey !== "YOUR_API_KEY" && 
    firebaseConfig.projectId && 
    firebaseConfig.projectId !== "your-project-id"
  ) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    functions = getFunctions(app);
    firebaseInitialized = true;
    console.log("Firebase initialized successfully");
  } else {
    console.log("Firebase initialization skipped: Valid configuration not found");
    // Create mock objects for a graceful experience even without Firebase
    app = null;
    auth = { currentUser: null };
    db = { collection: () => ({}) };
    functions = null;
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Create mock objects
  app = null;
  auth = { currentUser: null };
  db = { collection: () => ({}) };
  functions = null;
}

// Helper to check if Firebase is properly initialized
export const isFirebaseInitialized = () => firebaseInitialized;

export { app, auth, db, functions };
