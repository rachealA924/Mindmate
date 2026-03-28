// lib/firebase-admin.js
import admin from 'firebase-admin';

let app = null;

// FIX 1: Mark as async
async function initializeFirebase() {
  if (admin.apps.length > 0) {
    return admin.app();
  }
  
  try {
    if (process.env.FIREBASE_PROJECT_ID && 
        process.env.FIREBASE_PRIVATE_KEY && 
        process.env.FIREBASE_CLIENT_EMAIL) {
      
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }
      
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      
      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: privateKey,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        })
      });
      
      console.log('✅ Firebase Admin initialized with environment variables');
    } 
    else {
      try {
        // These dynamic imports require the function to be async
        const { readFileSync } = await import('fs');
        const { join } = await import('path');
        
        const serviceAccountPath = join(process.cwd(), 'service-account-key.json');
        const fileContent = readFileSync(serviceAccountPath, 'utf8');
        const serviceAccount = JSON.parse(fileContent);
        
        app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        
        console.log('✅ Firebase Admin initialized with service account file');
      } catch (fileError) {
        throw new Error('Firebase configuration missing. Check environment variables or service-account-key.json');
      }
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    throw error;
  }
  
  return app;
}

// FIX 2: Handle the Promise for the exports
const firebaseApp = await initializeFirebase();

export const auth = firebaseApp.auth();
export const db = firebaseApp.firestore();
export const adminInstance = admin;