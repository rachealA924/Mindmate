// api/auth/verify.js
import { db } from '../../lib/firebase-admin.js';
import { handleCors } from '../../lib/cors.js';
import { requireAuth } from '../../lib/auth-middleware.js';

export default async function handler(req, res) {
    // 1. Handle CORS and Preflight (OPTIONS) requests
    // Uses your specialized lib/cors.js logic to allow mindmate-sum.vercel.app, etc.
    if (handleCors(req, res)) return;

    // 2. Strict Method Check
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed. Use POST.',
            code: 'METHOD_NOT_ALLOWED' 
        });
    }

    try {
        console.log('=== AUTH VERIFY ENDPOINT CALLED ===');

        /**
         * 3. VERIFICATION STEP
         * requireAuth (from lib/auth-middleware.js) handles:
         * - Extracting the token from Authorization: Bearer <token>
         * - Validating the token via Firebase Admin SDK
         */
        const decoded = await requireAuth(req);
        console.log('✅ Token verified for user:', decoded.email);

        /**
         * 4. FIRESTORE SYNC STEP
         * Ensure the user is registered or updated in the database
         */
        if (!db) {
            console.warn('⚠️ Firestore not initialized, skipping DB sync');
            return res.status(200).json({
                success: true,
                user: {
                    uid: decoded.uid,
                    email: decoded.email,
                    name: decoded.name || decoded.email.split('@')[0],
                    picture: decoded.picture || '',
                    premium: false
                },
                warning: 'Database unavailable'
            });
        }

        const userRef = db.collection('users').doc(decoded.uid);
        const userDoc = await userRef.get();
        const timestamp = new Date().toISOString();
        
        const userData = {
            uid: decoded.uid,
            email: decoded.email,
            name: decoded.name || decoded.email.split('@')[0],
            picture: decoded.picture || '',
            lastLogin: timestamp,
        };

        let isPremium = false;

        if (!userDoc.exists) {
            console.log('🆕 Creating new user in Firestore:', decoded.uid);
            userData.createdAt = timestamp;
            userData.premium = false;
            await userRef.set(userData);
        } else {
            console.log('🔄 Updating existing user:', decoded.uid);
            isPremium = userDoc.data().premium || false;
            await userRef.update({ lastLogin: timestamp });
        }

        // 5. SUCCESS RESPONSE
        return res.status(200).json({
            success: true,
            user: {
                uid: decoded.uid,
                email: decoded.email,
                name: userData.name,
                picture: userData.picture,
                premium: isPremium
            }
        });

    } catch (err) {
        /**
         * 6. ERROR HANDLING
         * Catches errors from requireAuth (401s) or DB failures (500s)
         */
        console.error('❌ Auth verify error:', err.message);
        
        return res.status(err.status || 500).json({ 
            error: err.message || 'Authentication failed',
            code: err.code || 'UNKNOWN_ERROR'
        });
    }
}