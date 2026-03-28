import { db } from "../../../../lib/firebase-admin.js";
import { requireAuth } from "../../../../lib/auth-middleware.js";
import { handleCors } from "../../../../lib/cors.js";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const user = await requireAuth(req);
    const bookingId = req.query.bookingId;

    if (!bookingId) {
      return res.status(400).json({ error: "Booking ID is required" });
    }

    const bookingRef = db.collection("appointments").doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = bookingDoc.data();

    if (booking.userId !== user.uid) {
      return res.status(403).json({ error: "You are not authorized to cancel this booking" });
    }

    await bookingRef.update({
      status: "cancelled",
      cancelledAt: new Date().toISOString()
    });

    // (Optional) free up slot document if applicable
    if (booking.slotId) {
      const slotRef = db.collection("appointment_slots").doc(booking.slotId);
      await slotRef.update({
        isBooked: false,
        bookedBy: null,
        bookedAt: null
      }).catch(() => null);
    }

    return res.status(200).json({ success: true, message: "Booking cancelled" });
  } catch (err) {
    console.error("Error cancelling booking:", err);

    if (err.code === "TOKEN_EXPIRED" || err.code === "INVALID_TOKEN") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    return res.status(500).json({ error: "Failed to cancel booking" });
  }
}
