// api/therapists/availability.js
import { db } from "../../lib/firebase-admin.js";

export default async function handler(req, res) {
  // Set CORS headers
  const origin = req.headers.origin;
  
  if (origin && (
    origin.includes('localhost') || 
    origin.includes('127.0.0.1') ||
    origin === 'https://mindmate.vercel.app'
  )) {
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
    const { therapistId, date, month } = req.query;
    
    if (!therapistId) {
      return res.status(400).json({ error: 'therapistId is required' });
    }
    
    // Get therapist details
    const therapistDoc = await db.collection('therapists').doc(therapistId).get();
    if (!therapistDoc.exists) {
      return res.status(404).json({ error: 'Therapist not found' });
    }
    
    const therapist = { id: therapistDoc.id, ...therapistDoc.data() };
    
    // Build query for slots
    let query = db.collection('appointment_slots')
      .where('therapistId', '==', therapistId)
      .where('isBooked', '==', false);
    
    if (date) {
      query = query.where('date', '==', date);
    } else if (month) {
      const startDate = `${month}-01`;
      const endDate = `${month}-${new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).getDate()}`;
      query = query.where('date', '>=', startDate).where('date', '<=', endDate);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      query = query.where('date', '>=', today).where('date', '<=', nextWeek);
    }
    
    const slotsSnapshot = await query.orderBy('date').orderBy('time').get();
    
    const slots = slotsSnapshot.docs.map(doc => ({
      id: doc.id,
      date: doc.data().date,
      time: doc.data().time,
      type: doc.data().type,
      duration: doc.data().duration,
      price: doc.data().price
    }));
    
    // Group slots by date
    const groupedSlots = {};
    slots.forEach(slot => {
      if (!groupedSlots[slot.date]) {
        groupedSlots[slot.date] = [];
      }
      groupedSlots[slot.date].push(slot);
    });
    
    return res.status(200).json({
      therapist,
      slots: groupedSlots,
      totalAvailable: slots.length
    });
  } catch (err) {
    console.error('Error fetching availability:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}