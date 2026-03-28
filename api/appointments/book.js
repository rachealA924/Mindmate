// api/appointments/book.js
import { db } from "../../lib/firebase-admin.js";
import { requireAuth } from "../../lib/auth-middleware.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // Verify user is authenticated
    const user = await requireAuth(req);
    
    // Validate required fields
    const { fullname, email, type, date, time, therapistId, slotId, notes } = req.body;
    
    if (!fullname || !email || !date || !time || !therapistId) {
      return res.status(400).json({ error: "Missing required fields: fullname, email, date, time, therapistId" });
    }
    
    // Check if the slot exists and is available (with transaction to prevent double booking)
    const slotRef = db.collection("appointment_slots").doc(slotId);
    
    const result = await db.runTransaction(async (transaction) => {
      const slotDoc = await transaction.get(slotRef);
      
      if (!slotDoc.exists) {
        throw new Error("Time slot not found");
      }
      
      const slot = slotDoc.data();
      
      // Verify slot details match
      if (slot.therapistId !== therapistId || slot.date !== date || slot.time !== time) {
        throw new Error("Slot information mismatch");
      }
      
      if (slot.isBooked) {
        throw new Error("This time slot has already been booked");
      }
      
      // Check if user already has a booking at this time
      const existingBooking = await db.collection("appointments")
        .where("userId", "==", user.uid)
        .where("date", "==", date)
        .where("time", "==", time)
        .where("status", "in", ["pending", "confirmed"])
        .get();
      
      if (!existingBooking.empty) {
        throw new Error("You already have a booking at this time");
      }
      
      // Mark slot as booked
      transaction.update(slotRef, {
        isBooked: true,
        bookedBy: user.uid,
        bookedAt: new Date().toISOString()
      });
      
      // Create appointment
      const appointmentRef = db.collection("appointments").doc();
      const appointmentData = {
        id: appointmentRef.id,
        userId: user.uid,
        userEmail: email,
        userName: fullname,
        therapistId,
        slotId,
        date,
        time,
        type: type || "therapy",
        notes: notes || "",
        status: "confirmed",
        createdAt: new Date().toISOString()
      };
      
      transaction.set(appointmentRef, appointmentData);
      
      return { appointmentId: appointmentRef.id };
    });
    
    // Optionally create Google Calendar event
    let calendarEventId = null;
    try {
      calendarEventId = await createCalendarEvent({
        userId: user.uid,
        fullname,
        email,
        type,
        date,
        time,
        therapistId
      });
    } catch (calErr) {
      console.warn("Calendar event creation failed:", calErr.message);
    }
    
    return res.status(201).json({
      success: true,
      bookingId: result.appointmentId,
      calendarEventId,
      message: `✅ Appointment confirmed with ${fullname} on ${date} at ${time}. You'll receive a confirmation email shortly.`
    });
    
  } catch (err) {
    console.error("Booking error:", err);
    
    // Handle specific error types
    if (err.message === "This time slot has already been booked") {
      return res.status(409).json({ error: err.message });
    }
    if (err.message.includes("already have a booking")) {
      return res.status(409).json({ error: err.message });
    }
    
    return res.status(err.status || 500).json({ error: err.message || "Internal server error" });
  }
}

// Helper function for calendar integration
async function createCalendarEvent({ userId, fullname, email, type, date, time, therapistId }) {
  try {
    // Get therapist info
    const therapistDoc = await db.collection("therapists").doc(therapistId).get();
    if (!therapistDoc.exists) return null;
    
    const therapist = therapistDoc.data();
    
    // Get user's calendar token if stored
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
    
    if (!response.ok) {
      throw new Error("Calendar API failed");
    }
    
    const data = await response.json();
    return data.id;
  } catch (err) {
    console.error("Calendar creation error:", err);
    return null;
  }
}