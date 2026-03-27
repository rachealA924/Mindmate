// api/auth/verify.js
// POST /api/auth/verify  — verifies a Google ID token and returns safe user info
// Also saves the Google Calendar OAuth token securely to Firestore

import { adminAuth, db } from "../../lib/firebase-admin.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { idToken, calendarToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "idToken is required." });
    }

    // Verify the ID token server-side (this is the secure way)
    const decoded = await adminAuth.verifyIdToken(idToken);

    // Upsert user profile in Firestore
    await db.collection("users").doc(decoded.uid).set(
      {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name || "",
        picture: decoded.picture || "",
        lastLogin: new Date().toISOString(),
      },
      { merge: true }
    );

    // If the frontend passes a Google Calendar OAuth token, store it server-side
    // so calendar.js doesn't need to put it in localStorage anymore
    if (calendarToken) {
      await db.collection("user_tokens").doc(decoded.uid).set(
        {
          google_calendar_token: calendarToken,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    // Return safe user info (never return the raw token back to client)
    return res.status(200).json({
      success: true,
      user: {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name || "",
        picture: decoded.picture || "",
      },
    });
  } catch (err) {
    console.error("Auth verify error:", err);
    return res.status(401).json({ error: "Token verification failed. Please sign in again." });
  }
}