// api/appointments/book.js
import { db } from "../../lib/firebase-admin.js";
import { requireAuth } from "../../lib/auth-middleware.js";
import { handleCors } from "../../lib/cors.js";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const user = await requireAuth(req);
    const { fullname, email, type, date, time, therapistId, slotId, notes } = req.body;
    
    console.log(`📝 Booking request for user: ${user.uid}, slot: ${slotId}, date: ${date}, time: ${time}`);
    
    // 1. Pre-Transaction Check
    const existing = await db.collection("appointments")
      .where("userId", "==", user.uid)
      .where("date", "==", date)
      .where("time", "==", time)
      .limit(1)
      .get();
    
    if (!existing.empty) {
      console.log(`⚠️ User ${user.uid} already has booking at ${date} ${time}`);
      return res.status(409).json({ error: "You already have a booking at this time" });
    }

    const slotRef = db.collection("appointment_slots").doc(slotId);
    
    // 2. The Atomic Transaction
    const result = await db.runTransaction(async (transaction) => {
      const slotDoc = await transaction.get(slotRef);
      
      if (!slotDoc.exists) {
        console.log(`❌ Slot ${slotId} not found`);
        throw new Error("Time slot not found");
      }
      
      const slot = slotDoc.data();
      console.log(`🔍 Slot status: isBooked=${slot.isBooked}, bookedBy=${slot.bookedBy || 'none'}`);
      
      if (slot.isBooked) {
        console.log(`❌ Slot ${slotId} already booked by ${slot.bookedBy}`);
        throw new Error("This time slot has already been booked");
      }

      // WRITE LAST
      const appointmentRef = db.collection("appointments").doc();
      
      transaction.update(slotRef, {
        isBooked: true,
        bookedBy: user.uid,
        bookedAt: new Date().toISOString()
      });

      transaction.set(appointmentRef, {
        id: appointmentRef.id,
        userId: user.uid,
        userEmail: email,
        userName: fullname,
        therapistId,
        slotId,
        date,
        time,
        status: "confirmed",
        createdAt: new Date().toISOString()
      });
      
      console.log(`✅ Successfully booked slot ${slotId} for user ${user.uid}`);
      return { appointmentId: appointmentRef.id };
    });

    // 3. Post-Transaction: Calendar (Do not put this inside the transaction!)
    createCalendarEvent({ userId: user.uid, fullname, email, type, date, time, therapistId })
      .catch(e => console.warn("Non-critical Calendar Failure:", e.message));
    
    return res.status(201).json({
      success: true,
      message: "Appointment confirmed!",
      bookingId: result.appointmentId
    });
    
  } catch (err) {
    console.error("❌ Booking error details:", err.message);
    
    // Distinguish between conflict and server error
    if (err.message === "This time slot has already been booked") {
      return res.status(409).json({ error: err.message });
    }
    
    return res.status(500).json({ error: "Internal server error during booking." });
  }
}
// Helper function for calendar integration
async function createCalendarEvent({ userId, fullname, email, type, date, time, therapistId }) {
  try {
    const therapistDoc = await db.collection("therapists").doc(therapistId).get();
    if (!therapistDoc.exists) return null;
    
    const therapist = therapistDoc.data();
    
    const tokenDoc = await db.collection("user_tokens").doc(userId).get();
    if (!tokenDoc.exists || !tokenDoc.data().google_calendar_token) {
      return null;
    }
    
    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
    
    const event = {
      summary: `MindMate Session: ${type} with ${therapist.name}`,
      description: `Therapy session booked via MindMate.\n\nPatient: ${fullname}\nEmail: ${email}\nTherapist: ${therapist.name}\n\n${type === "couples" ? "Note: This is a couples therapy session." : ""}`,
      start: { dateTime: startDateTime.toISOString(), timeZone: "Africa/Nairobi" },
      end: { dateTime: endDateTime.toISOString(), timeZone: "Africa/Nairobi" },
      attendees: [{ email }, { email: therapist.email }],
      reminders: { useDefault: true }
    };
    
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenDoc.data().google_calendar_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );
    
    if (!response.ok) throw new Error("Calendar API failed");
    
    const data = await response.json();
    return data.id;
  } catch (err) {
    console.error("Calendar creation error:", err);
    return null;
  }
}