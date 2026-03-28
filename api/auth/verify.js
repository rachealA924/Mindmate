// api/auth/verify.js
import { auth, db } from '../../lib/firebase-admin.js';
import { handleCors } from '../../lib/cors.js';

export default async function handler(req, res) {
  // Handle CORS - this must be FIRST
  if (handleCors(req, res)) return;
  
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'idToken is required.' });
    }

    // Verify the ID token
    const decoded = await auth.verifyIdToken(idToken);

    // Get or create user
    const userRef = db.collection('users').doc(decoded.uid);
    const userDoc = await userRef.get();
    
    const userData = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name || decoded.email.split('@')[0],
      picture: decoded.picture || '',
      lastLogin: new Date().toISOString(),
    };
    
    if (!userDoc.exists) {
      userData.createdAt = new Date().toISOString();
      userData.premium = false;
    }
    
    await userRef.set(userData, { merge: true });

    return res.status(200).json({
      success: true,
      user: {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name || decoded.email.split('@')[0],
        picture: decoded.picture || '',
        premium: userDoc.exists ? userDoc.data().premium : false
      },
      token: idToken
    });
    
  } catch (err) {
    console.error('Auth verify error:', err);
    return res.status(401).json({ 
      error: 'Token verification failed. Please sign in again.',
      details: err.message 
    });
  }
}