// api/auth/verify.js
import { auth, db } from "../../lib/firebase-admin.js";

export default async function handler(req, res) {
  // Set CORS headers - this is critical for localhost development
  const origin = req.headers.origin;
  
  // Allow all localhost origins and your Vercel domains
  if (origin && (
    origin.includes('localhost') || 
    origin.includes('127.0.0.1') ||
    origin === 'https://mindmate.vercel.app' ||
    origin === 'https://mindmate-sum.vercel.app' ||
    origin === 'https://mindmate-navy.vercel.app' ||
    origin === 'https://mindmate-git-main.vercel.app'
  )) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    // Fallback for other origins
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  // These headers must be set for both preflight and actual requests
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours cache for preflight

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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
    return res.status(401).json({ error: 'Token verification failed. Please sign in again.' });
  }
}