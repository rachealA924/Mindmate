// lib/firebase-admin.js
import admin from 'firebase-admin';

let app = null;

function initializeFirebase() {
  // If an app instance already exists, return it
  if (admin.apps.length > 0) {
    return admin.app();
  }
  
  try {
    // Check for required Vercel environment variables
    if (process.env.FIREBASE_PROJECT_ID && 
        process.env.FIREBASE_PRIVATE_KEY && 
        process.env.FIREBASE_CLIENT_EMAIL) {
      
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      
      // Handle escaped newlines
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }
      
      // Remove quotes if present
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
    // Local development fallback
    else {
      try {
        const { readFileSync } = await import('fs');
        const { join } = await import('path');
        
        const serviceAccountPath = join(process.cwd(), 'service-account-key.json');
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
        
        app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id,
        });
        
        console.log('✅ Firebase Admin initialized with service account file');
      } catch (fileError) {
        console.error('❌ Configuration Error:', fileError.message);
        throw new Error('Firebase configuration missing. Check environment variables.');
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

// Export initialized services
export const auth = firebaseApp.auth();
export const db = firebaseApp.firestore();
export const adminInstance = admin;