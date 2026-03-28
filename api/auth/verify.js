// api/auth/verify.js
import { auth, db } from '../../lib/firebase-admin.js';
import { handleCors } from '../../lib/cors.js';

export default async function handler(req, res) {
  // Add CORS headers first
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    console.log('=== AUTH VERIFY ENDPOINT CALLED ===');
    console.log('Request body:', req.body);
    console.log('Has idToken:', !!req.body?.idToken);
    
    const { idToken } = req.body;

    if (!idToken) {
      console.error('No idToken provided');
      return res.status(400).json({ error: 'idToken is required.' });
    }

    // Check if auth is initialized
    if (!auth) {
      console.error('Firebase Auth not initialized');
      return res.status(500).json({ 
        error: 'Authentication service not initialized',
        details: 'Firebase Admin SDK configuration missing'
      });
    }

    console.log('Verifying Firebase ID token...');
    
    // Verify the token with more detailed error handling
    let decoded;
    try {
      decoded = await auth.verifyIdToken(idToken);
      console.log('Token verified successfully for user:', decoded.email);
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      
      // Provide more specific error messages
      if (verifyError.code === 'auth/id-token-expired') {
        return res.status(401).json({ error: 'Token has expired. Please sign in again.' });
      }
      if (verifyError.code === 'auth/argument-error') {
        return res.status(400).json({ error: 'Invalid token format.' });
      }
      if (verifyError.code === 'auth/user-not-found') {
        return res.status(401).json({ error: 'User not found.' });
      }
      
      throw verifyError;
    }

    // Check if db is initialized
    if (!db) {
      console.error('Firestore not initialized');
      // Still return success without DB access
      return res.status(200).json({
        success: true,
        user: {
          uid: decoded.uid,
          email: decoded.email,
          name: decoded.name || decoded.email.split('@')[0],
          picture: decoded.picture || '',
          premium: false
        },
        token: idToken,
        warning: 'User data not saved - database unavailable'
      });
    }

    // Try to get or create user in Firestore
    try {
      console.log('Checking user in Firestore...');
      const userRef = db.collection('users').doc(decoded.uid);
      const userDoc = await userRef.get();
      
      const userData = {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name || decoded.email.split('@')[0],
        picture: decoded.picture || '',
        lastLogin: new Date().toISOString(),
      };
      
      let isPremium = false;
      
      if (!userDoc.exists) {
        console.log('Creating new user in Firestore...');
        userData.createdAt = new Date().toISOString();
        userData.premium = false;
        await userRef.set(userData);
      } else {
        console.log('Updating existing user...');
        isPremium = userDoc.data().premium || false;
        // Update last login only
        await userRef.update({ lastLogin: new Date().toISOString() });
      }

      console.log('User processed successfully');
      
      return res.status(200).json({
        success: true,
        user: {
          uid: decoded.uid,
          email: decoded.email,
          name: decoded.name || decoded.email.split('@')[0],
          picture: decoded.picture || '',
          premium: isPremium
        },
        token: idToken
      });
      
    } catch (dbError) {
      console.error('Firestore error:', dbError);
      // Still return success even if DB fails
      return res.status(200).json({
        success: true,
        user: {
          uid: decoded.uid,
          email: decoded.email,
          name: decoded.name || decoded.email.split('@')[0],
          picture: decoded.picture || '',
          premium: false
        },
        token: idToken,
        warning: 'User data saved with limitations'
      });
    }
    
  } catch (err) {
    console.error('Auth verify error:', err);
    console.error('Error stack:', err.stack);
    
    return res.status(500).json({ 
      error: 'Token verification failed. Please sign in again.',
      details: err.message,
      code: err.code || 'unknown_error'
    });
  }
}