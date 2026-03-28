// auth.js - Updated to manage button visibility
import { auth, provider } from './firebase-config.js';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const API_BASE = window.location.origin;

// Check auth state on page load
document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, (user) => {
    updateAuthUI(user);
  });
});

function updateAuthUI(user) {
  const loginContainer = document.querySelector(".g_id_signin, #google-login-container");
  const userInfo = document.getElementById("user-info");
  const logoutBtn = document.getElementById("logout-btn");
  
  if (user) {
    // User is signed in - hide login button, show user info
    if (loginContainer) loginContainer.style.display = "none";
    
    if (!userInfo) {
      // Create user info display if it doesn't exist
      const bookingForm = document.querySelector(".booking-form");
      if (bookingForm) {
        const infoDiv = document.createElement("div");
        infoDiv.id = "user-info";
        infoDiv.className = "user-info";
        infoDiv.innerHTML = `
          <p>✅ Signed in as: <strong>${user.email}</strong></p>
          <button id="logout-btn" class="logout-button">Sign Out</button>
        `;
        bookingForm.insertBefore(infoDiv, bookingForm.firstChild);
        
        document.getElementById("logout-btn").addEventListener("click", async () => {
          await auth.signOut();
          localStorage.removeItem("mindmate_user");
          localStorage.removeItem("mindmate_user_name");
          localStorage.removeItem("mindmate_id_token");
          updateAuthUI(null);
          window.location.reload();
        });
      }
    }
  } else {
    // User is signed out - show login button, hide user info
    if (loginContainer) loginContainer.style.display = "block";
    if (userInfo) userInfo.remove();
  }
}

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const idToken = await result.user.getIdToken();

    const response = await fetch(`${API_BASE}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken,
        calendarToken: credential?.accessToken || null,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Backend verification failed");
    }

    const { user } = await response.json();

    localStorage.setItem("mindmate_user", user.email);
    localStorage.setItem("mindmate_user_name", user.name);
    localStorage.setItem("mindmate_id_token", idToken);
    
    // Update UI immediately
    updateAuthUI(result.user);
    
    setTimeout(() => { window.location.href = "self-check.html"; }, 500);
  } catch (error) {
    console.error("Auth Error:", error.message);
    alert("Login failed: " + error.message);
  }
}

