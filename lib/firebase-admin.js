// lib/firebase-admin.js
import admin from 'firebase-admin';

let app = null;

function initializeFirebase() {
  // If an app instance already exists, return it to prevent "Already Initialized" errors
  if (admin.apps.length > 0) {
    return admin.app();
  }
  
  try {
    // Check for required Vercel environment variables
    if (process.env.FIREBASE_PROJECT_ID && 
        process.env.FIREBASE_PRIVATE_KEY && 
        process.env.FIREBASE_CLIENT_EMAIL) {
      
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      
      // FIX: Standardize the private key format for Vercel
      // 1. Replace literal '\n' strings with actual newline characters
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }
      
      // 2. Remove any surrounding double quotes
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      
      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: privateKey,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
      
      console.log('✅ Firebase Admin initialized with environment variables');
    }
    // Fallback for local development using a service account file
    else {
      try {
        const fs = require('fs');
        const path = require('path');
        
        const serviceAccountPath = path.join(process.cwd(), 'service-account-key.json');
        
        if (fs.existsSync(serviceAccountPath)) {
          const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
          
          app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id,
          });
          
          console.log('✅ Firebase Admin initialized with service account file');
        } else {
          throw new Error('Service account file not found and environment variables are missing.');
        }
      } catch (fileError) {
        console.error('❌ Configuration Error:', fileError.message);
        throw new Error('Firebase configuration missing. Check Vercel environment variables.');
      }
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    throw error;
  }
  
  return app;
}

// Execute initialization
const firebaseApp = initializeFirebase();

// Export initialized services for use in middleware and API routes
export const auth = firebaseApp.auth();
export const db = firebaseApp.firestore();
export const adminInstance = admin; // Renamed to avoid confusion with the library import