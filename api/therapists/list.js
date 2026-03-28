// api/therapists/list.js
import { db } from '../../lib/firebase-admin.js';
import { requireAuth } from '../../lib/auth-middleware.js';
import { handleCors } from '../../lib/cors.js';

export default async function handler(req, res) {
  // Handle CORS first
  if (handleCors(req, res)) return;
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let isPremium = false;
    
    try {
      const user = await requireAuth(req);
      const userDoc = await db.collection('users').doc(user.uid).get();
      isPremium = userDoc.exists && userDoc.data().premium === true;
    } catch (err) {
      console.log('User not authenticated, showing public therapists');
    }
    
    const therapistsSnapshot = await db.collection('therapists').get();
    const therapists = [];
    
    for (const doc of therapistsSnapshot.docs) {
      const therapist = { id: doc.id, ...doc.data() };
      
      if (therapist.premiumOnly && !isPremium) {
        continue;
      }
      
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