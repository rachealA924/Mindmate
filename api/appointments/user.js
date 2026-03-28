import { db } from "../../lib/firebase-admin.js";
import { requireAuth } from "../../lib/auth-middleware.js";
import { handleCors } from "../../lib/cors.js";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const user = await requireAuth(req);

    let appointmentsSnapshot;
    try {
      appointmentsSnapshot = await db.collection("appointments")
        .where("userId", "==", user.uid)
        .orderBy("date", "desc")
        .orderBy("time", "desc")
        .get();
    } catch (e) {
      console.warn("User bookings orderBy caused error, falling back to unordered query:", e.message);
      appointmentsSnapshot = await db.collection("appointments")
        .where("userId", "==", user.uid)
        .get();
    }

    const bookings = [];

    for (const doc of appointmentsSnapshot.docs) {
      const booking = doc.data();

      if (booking.therapistId) {
        const therapistDoc = await db.collection("therapists").doc(booking.therapistId).get();
        if (therapistDoc.exists) {
          booking.therapistName = therapistDoc.data().name;
        }
      }

      bookings.push({
        id: doc.id,
        ...booking
      });
    }

    // Ensure deterministic date/time sorting even in fallback path
    bookings.sort((a, b) => {
      if (a.date > b.date) return -1;
      if (a.date < b.date) return 1;
      if (a.time > b.time) return -1;
      if (a.time < b.time) return 1;
      return 0;
    });

    return res.status(200).json({
      success: true,
      bookings
    });
  } catch (err) {
    console.error("Error fetching user bookings:", err);
    return res.status(500).json({ error: "Failed to fetch bookings" });
  }
}
