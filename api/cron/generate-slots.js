// api/cron/generate-slots.js
// This can be run via a cron job or Vercel cron jobs

import { db } from "../../lib/firebase-admin.js";

export default async function handler(req, res) {
  // Verify cron secret
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    // Get all therapists
    const therapistsSnapshot = await db.collection("therapists").get();
    
    let totalSlotsGenerated = 0;
    
    for (const therapistDoc of therapistsSnapshot.docs) {
      const therapist = { id: therapistDoc.id, ...therapistDoc.data() };
      
      // Generate slots for next 14 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        
        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;
        
        const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
        const availableSlots = therapist.workingHours[dayName];
        
        if (availableSlots && availableSlots.length > 0) {
          const dateStr = d.toISOString().split('T')[0];
          
          // Check if slots already exist for this date
          const existingSlots = await db.collection("appointment_slots")
            .where("therapistId", "==", therapist.id)
            .where("date", "==", dateStr)
            .get();
          
          if (existingSlots.empty) {
            // Create new slots
            const batch = db.batch();
            
            for (const time of availableSlots) {
              const slotRef = db.collection("appointment_slots").doc();
              batch.set(slotRef, {
                therapistId: therapist.id,
                therapistName: therapist.name,
                date: dateStr,
                time: time,
                isBooked: false,
                type: therapist.specialization.includes('Couples') ? 'couples' : 'individual',
                duration: 60,
                price: therapist.premiumOnly ? 50 : 30,
                createdAt: new Date().toISOString()
              });
              totalSlotsGenerated++;
            }
            
            await batch.commit();
          }
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      slotsGenerated: totalSlotsGenerated,
      message: `Generated ${totalSlotsGenerated} new appointment slots`
    });
    
  } catch (err) {
    console.error("Error generating slots:", err);
    return res.status(500).json({ error: err.message });
  }
}