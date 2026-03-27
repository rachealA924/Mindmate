// lib/auth-middleware.js
// Verifies Google ID token sent from the frontend

import { adminAuth } from "./firebase-admin.js";

/**
 * Call this at the top of any protected API route.
 * Returns the decoded token (with uid, email, name) or throws.
 *
 * Frontend must send:  Authorization: Bearer <idToken>
 */
export async function requireAuth(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    const err = new Error("Missing authorization token");
    err.status = 401;
    throw err;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded; // { uid, email, name, ... }
  } catch {
    const err = new Error("Invalid or expired token");
    err.status = 401;
    throw err;
  }
}