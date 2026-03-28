// api/therapists/list.js
import { db } from '../../lib/firebase-admin.js';
import { requireAuth } from '../../lib/auth-middleware.js';

export default async function handler(req, res) {
  // CORS headers
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://mindmate.vercel.app',
    'https://mindmate-git-main.vercel.app'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Optional authentication - get user if logged in
    let user = null;
    let isPremium = false;
    
    try {
      user = await requireAuth(req);
      const userDoc = await db.collection('users').doc(user.uid).get();
      isPremium = userDoc.exists && userDoc.data().premium === true;
    } catch (err) {
      // User not logged in - continue without premium status
      console.log('User not authenticated, showing public therapists');
    }
    
    // Get all therapists
    const therapistsSnapshot = await db.collection('therapists').get();
    const therapists = [];
    
    for (const doc of therapistsSnapshot.docs) {
      const therapist = { id: doc.id, ...doc.data() };
      
      // Filter premium therapists for non-premium users
      if (therapist.premiumOnly && !isPremium) {
        continue;
      }
      
      // Get available slots for next 7 days
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      
      const slotsSnapshot = await db.collection('appointment_slots')
        .where('therapistId', '==', doc.id)
        .where('date', '>=', today)
        .where('date', '<=', nextWeek)
        .where('isBooked', '==', false)
        .orderBy('date')
        .orderBy('time')
        .get();
      
      // Group slots by date
      const availableSlots = {};
      slotsSnapshot.docs.forEach(slotDoc => {
        const slot = { id: slotDoc.id, ...slotDoc.data() };
        if (!availableSlots[slot.date]) {
          availableSlots[slot.date] = [];
        }
        availableSlots[slot.date].push({ time: slot.time, id: slot.id });
      });
      
      therapist.availableSlots = availableSlots;
      therapists.push(therapist);
    }
    
    return res.status(200).json({ therapists, isPremium });
  } catch (err) {
    console.error('Error fetching therapists:', err);
    return res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
}