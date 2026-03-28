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
    let user = null;
    
    // Try to authenticate, but don't fail if not authenticated
    try {
      user = await requireAuth(req);
      if (user && user.uid) {
        const userDoc = await db.collection('users').doc(user.uid).get();
        isPremium = userDoc.exists && userDoc.data().premium === true;
        console.log(`✅ Authenticated user: ${user.uid}, Premium: ${isPremium}`);
      }
    } catch (err) {
      console.log('⚠️ User not authenticated, showing public therapists only:', err.message);
      // Continue without authentication
    }
    
    // Fetch therapists
    console.log('📡 Fetching therapists from Firestore...');
    const therapistsSnapshot = await db.collection('therapists').get();
    
    if (therapistsSnapshot.empty) {
      console.log('⚠️ No therapists found in database');
      return res.status(200).json({ therapists: [], isPremium, message: 'No therapists available' });
    }
    
    console.log(`✅ Found ${therapistsSnapshot.size} therapists in database`);
    
    const therapists = [];
    
    for (const doc of therapistsSnapshot.docs) {
      try {
        const therapist = { id: doc.id, ...doc.data() };
        
        // Filter premium therapists if user is not premium
        if (therapist.premiumOnly && !isPremium) {
          console.log(`⏭️ Skipping premium therapist: ${therapist.name}`);
          continue;
        }
        
        // Calculate available slots count (optional)
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        
        try {
          const slotsSnapshot = await db.collection('appointment_slots')
            .where('therapistId', '==', doc.id)
            .where('date', '>=', today)
            .where('date', '<=', nextWeek)
            .where('isBooked', '==', false)
            .orderBy('date')
            .orderBy('time')
            .limit(50) // Limit to avoid performance issues
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
          therapist.availableSlotsCount = slotsSnapshot.size;
        } catch (slotError) {
          console.warn(`⚠️ Could not fetch slots for therapist ${therapist.name}:`, slotError.message);
          therapist.availableSlots = {};
          therapist.availableSlotsCount = 0;
        }
        
        therapists.push(therapist);
        console.log(`✅ Added therapist: ${therapist.name} (${therapist.availableSlotsCount} available slots)`);
        
      } catch (therapistError) {
        console.error(`❌ Error processing therapist ${doc.id}:`, therapistError.message);
        // Continue with next therapist
      }
    }
    
    console.log(`✅ Returning ${therapists.length} therapists to client`);
    
    return res.status(200).json({ 
      therapists, 
      isPremium,
      total: therapists.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('❌ Error fetching therapists:', err);
    console.error('Error stack:', err.stack);
    
    // Return detailed error in development, generic in production
    const isDev = process.env.NODE_ENV !== 'production';
    
    return res.status(err.status || 500).json({ 
      error: err.message || 'Internal server error',
      details: isDev ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
}