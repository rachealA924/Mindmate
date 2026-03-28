// lib/firebase-admin.js - Simplified version
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK synchronously
let app = null;

function initializeFirebase() {
  if (app) return app;
  
  try {
    // For production (Vercel) - use environment variables
    if (process.env.FIREBASE_PROJECT_ID && 
        process.env.FIREBASE_PRIVATE_KEY && 
        process.env.FIREBASE_CLIENT_EMAIL) {
      
      // IMPORTANT: Handle the private key correctly
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      
      // If the key doesn't already have newlines, replace \n with actual newlines
      if (privateKey && !privateKey.includes('\n') && privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }
      
      // Also handle case where key is wrapped in quotes
      if (privateKey && privateKey.startsWith('"') && privateKey.endsWith('"')) {
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
    // For local development - use service account key file
    else {
      try {
        // Use require for fs/path in Node.js environment
        // This is synchronous and works in both ESM and CommonJS
        const fs = require('fs');
        const path = require('path');
        
        const serviceAccountPath = path.join(process.cwd(), 'service-account-key.json');
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        
        app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id,
        });
        
        console.log('✅ Firebase Admin initialized with service account file');
      } catch (fileError) {
        console.error('❌ Service account file not found. Please add service-account-key.json or environment variables.');
        throw new Error('Firebase configuration missing. Add service-account-key.json or environment variables.');
      }
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    throw error;
  }
  
  return app;
}

// Initialize Firebase synchronously
const firebaseApp = initializeFirebase();

// Export initialized services
export const auth = firebaseApp.auth();
export const db = firebaseApp.firestore();
export const admin = firebaseApp;