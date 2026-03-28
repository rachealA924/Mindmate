// lib/auth-middleware.js
import { auth } from './firebase-admin.js';

export async function requireAuth(req) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('No token provided. Please sign in.');
      error.status = 401;
      error.code = 'NO_TOKEN';
      throw error;
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    if (!token || token === 'null' || token === 'undefined') {
      const error = new Error('Invalid token format.');
      error.status = 401;
      error.code = 'INVALID_TOKEN';
      throw error;
    }
    
    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(token);
    
    return decodedToken;
    
  } catch (error) {
    console.error('Auth error:', error.code || error.message);
    
    // Handle specific Firebase auth errors
    if (error.code === 'auth/id-token-expired') {
      const authError = new Error('Your session has expired. Please sign in again.');
      authError.status = 401;
      authError.code = 'TOKEN_EXPIRED';
      throw authError;
    }
    
    if (error.code === 'auth/argument-error') {
      const authError = new Error('Invalid authentication token.');
      authError.status = 401;
      authError.code = 'INVALID_TOKEN';
      throw authError;
    }
    
    // Generic auth error
    const authError = new Error(error.message || 'Unauthorized. Please sign in.');
    authError.status = 401;
    authError.code = error.code || 'UNAUTHORIZED';
    throw authError;
  }
}

// Optional: Get user without throwing error (returns null if not authenticated)
export async function optionalAuth(req) {
  try {
    return await requireAuth(req);
  } catch (error) {
    return null;
  }
}

// Helper to check if user is premium
export async function isPremiumUser(userId) {
  if (!userId) return false;
  
  try {
    const { db } = await import('./firebase-admin.js');
    const userDoc = await db.collection('users').doc(userId).get();
    return userDoc.exists && userDoc.data().premium === true;
  } catch (error) {
    console.error('Failed to check premium status:', error.message);
    return false;
  }
}