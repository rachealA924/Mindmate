// auth.js  (UPDATED — replaces the old version)
// Signs in with Google via Firebase, then verifies the token server-side

import { auth, provider } from './firebase-config.js';
import { signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const API_BASE = "https://mindmate.vercel.app/api"; // ← change if your domain differs

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const idToken = await result.user.getIdToken();

    // Send ID token + calendar token to backend for secure verification
    const response = await fetch(`${API_BASE}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken,
        calendarToken: credential?.accessToken || null, // stored server-side now
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Backend verification failed");
    }

    const { user } = await response.json();

    // Only store non-sensitive display info in localStorage
    // The real token and calendar token live on the server now
    localStorage.setItem("mindmate_user", user.email);
    localStorage.setItem("mindmate_user_name", user.name);
    // Store the Firebase ID token for subsequent authenticated API calls
    localStorage.setItem("mindmate_id_token", idToken);

    setTimeout(() => { window.location.href = "self-check.html"; }, 500);
  } catch (error) {
    console.error("Auth Error:", error.message);
    alert("Login failed: " + error.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("google-login-btn");
  if (loginBtn) loginBtn.addEventListener("click", loginWithGoogle);
});