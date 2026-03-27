// api/appointments/book.js
// POST /api/appointments/book  — save booking to Firestore + create Google Calendar event

import { db } from "../../lib/firebase-admin.js";
import { requireAuth } from "../../lib/auth-middleware.js";

export default async function handler(req, res) {
  // CORS headers — replace with your actual Vercel domain in production
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // 1. Verify the user is signed in
    const user = await requireAuth(req);

    // 2. Validate body
    const { fullname, email, type, date, time, notes } = req.body;
    if (!fullname || !email || !date || !time) {
      return res.status(400).json({ error: "fullname, email, date and time are required." });
    }

    // 3. Save to Firestore
    const docRef = await db.collection("appointments").add({
      uid: user.uid,
      fullname,
      email,
      type: type || "therapy",
      date,
      time,
      notes: notes || "",
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    // 4. Optionally create a Google Calendar event using the stored token
    //    (only if the user granted calendar access — token saved server-side)
    let calendarEventId = null;
    try {
      calendarEventId = await createCalendarEvent({ user, fullname, type, date, time });
    } catch (calErr) {
      // Non-fatal — booking still succeeds without calendar
      console.warn("Calendar event creation failed:", calErr.message);
    }

    return res.status(201).json({
      success: true,
      bookingId: docRef.id,
      calendarEventId,
      message: `Appointment booked for ${fullname} on ${date} at ${time}.`,
    });
  } catch (err) {
    console.error("Booking error:", err);
    return res.status(err.status || 500).json({ error: err.message || "Internal server error" });
  }
}

// ─── Google Calendar helper ───────────────────────────────────────────────────
async function createCalendarEvent({ user, fullname, type, date, time }) {
  // Retrieve the user's stored OAuth token from Firestore
  const tokenDoc = await db.collection("user_tokens").doc(user.uid).get();
  if (!tokenDoc.exists) throw new Error("No calendar token found for user");

  const { google_calendar_token } = tokenDoc.data();

  const startDateTime = new Date(`${date}T${time}:00`);
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // +1 hour

  const event = {
    summary: `MindMate Session: ${type} — ${fullname}`,
    description: "Mental wellness consultation booked via MindMate.",
    start: { dateTime: startDateTime.toISOString(), timeZone: "Africa/Kigali" },
    end: { dateTime: endDateTime.toISOString(), timeZone: "Africa/Kigali" },
  };

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${google_calendar_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error?.message || "Calendar API failed");
  }

  const data = await response.json();
  return data.id;
}