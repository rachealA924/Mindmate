const API_BASE = window.location.origin;

console.log('========================================');
console.log(`🌐 Environment: PRODUCTION`);
console.log(`🔗 API Endpoint: ${API_BASE}`);
console.log('========================================');

// Global variables
let selectedTherapist = null;
let selectedSlot = null;
let currentUser = null;
let firebaseAuth = null;
let isInitializing = false;
let isVerifying = false; // FIX 3: Add verification lock

// Import Firebase dynamically
async function initFirebase() {
  if (window.firebaseInitialized) return;
  if (isInitializing) return;

  isInitializing = true;
  console.log("🔥 Initializing Firebase...");

  try {
    // Dynamically import Firebase modules
    const firebaseAppModule = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
    const firebaseAuthModule = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');

    const firebaseConfig = {
      apiKey: "AIzaSyD0tGDETCjJX-LlNqFzqG3Umvmk8EYLUNs",
      authDomain: "mindmate-467614.firebaseapp.com",
      projectId: "mindmate-467614",
      storageBucket: "mindmate-467614.firebasestorage.app",
      messagingSenderId: "443513007248",
      appId: "1:443513007248:web:d1f919b600aaeac2f5bc15"
    };

    const app = firebaseAppModule.initializeApp(firebaseConfig);
    firebaseAuth = firebaseAuthModule.getAuth(app);

    // Store auth instance globally
    window.firebaseAuth = firebaseAuth;
    window.firebaseInitialized = true;

    console.log("✅ Firebase initialized successfully");

    // Listen to auth state changes
    firebaseAuthModule.onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        console.log("👤 Firebase auth state changed: user signed in");
        const idToken = await user.getIdToken();
        await handleFirebaseUser(user, idToken);
      } else {
        console.log("👤 Firebase auth state changed: user signed out");
        if (localStorage.getItem("mindmate_id_token")) {
          localStorage.clear();
          window.location.reload();
        }
      }
    });

    return { auth: firebaseAuth };
  } catch (error) {
    console.error("❌ Failed to initialize Firebase:", error);
    isInitializing = false;
    return null;
  }
}

// FIX 3: Add verification lock to prevent race conditions
async function handleFirebaseUser(user, idToken) {
  // Prevent multiple simultaneous verifications
  if (isVerifying) {
    console.log("⚠️ Verification already in progress, skipping...");
    return;
  }

  isVerifying = true;

  try {
    const message = document.getElementById("booking-message");
    if (message) {
      message.textContent = "🔐 Verifying your sign-in...";
      message.style.color = "blue";
    }

    console.log(`📡 Verifying token with: ${API_BASE}/api/auth/verify`);

    // Send token to backend for verification
    const verifyRes = await fetch(`${API_BASE}/api/auth/verify`, {
      method: "POST",
      mode: 'cors',
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${idToken}` // FIX 2: Add Authorization header
      },
      body: JSON.stringify({ idToken }) // FIX 1: Use the parameter name
    });

    console.log(`📥 Response status: ${verifyRes.status}`);

    if (!verifyRes.ok) {
      let errorMessage = `HTTP ${verifyRes.status}`;
      try {
        const errorData = await verifyRes.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        const errorText = await verifyRes.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await verifyRes.json();
    console.log("✅ Verification successful:", data.user.email);

    // Store user data
    localStorage.setItem("mindmate_id_token", data.token || idToken);
    localStorage.setItem("mindmate_user", data.user.email);
    localStorage.setItem("mindmate_user_name", data.user.name);
    localStorage.setItem("mindmate_user_data", JSON.stringify(data.user));
    currentUser = data.user;

    // Hide login container
    const authContainer = document.getElementById("auth-container");
    if (authContainer) authContainer.style.display = "none";

    // Show user info
    const userInfoDiv = document.getElementById("user-info");
    if (userInfoDiv) {
      userInfoDiv.style.display = "block";
      userInfoDiv.innerHTML = `
        <div class="user-info-card">
          <p>✅ Signed in as: <strong>${data.user.name || data.user.email}</strong></p>
          <button id="logout-btn" class="logout-button">Sign Out</button>
        </div>
      `;

      document.getElementById("logout-btn")?.addEventListener("click", async () => {
        if (firebaseAuth) {
          await firebaseAuth.signOut();
        }
        localStorage.clear();
        window.location.reload();
      });
    }

    if (message) {
      message.textContent = `✅ Welcome ${data.user.name || data.user.email}!`;
      message.style.color = "green";
      setTimeout(() => message.textContent = "", 3000);
    }

    let errorMsg = "You already have a booking scheduled at this time.";
    if (conflictingBooking) {
      errorMsg += `…Existing booking:\n📅 ${conflictingBooking.date}\n⏰ ${conflictingBooking.time}\n…`;
    }
    throw new Error(errorMsg);    // Load therapists and existing bookings list
    await loadTherapists();
    setupBookingForm();
    await loadUserBookings();

  } catch (error) {
    console.error("❌ Sign-in error:", error);

    const message = document.getElementById("booking-message");
    if (message) {
      let errorMsg = error.message;
      if (error.message.includes('Failed to fetch')) {
        errorMsg = "Cannot connect to the server. Please check your internet connection or try again later.";
      }
      message.innerHTML = `❌ Sign-in failed: ${errorMsg}<br><small>Try clicking the "Alternative Sign-in" button below.</small>`;
      message.style.color = "red";
    }

    // Show fallback button
    const fallback = document.getElementById("firebase-auth-fallback");
    if (fallback) fallback.style.display = "block";
  } finally {
    isVerifying = false;
  }
}

// Firebase sign-in with popup
async function signInWithFirebase() {
  try {
    console.log("🔐 Starting Firebase sign-in...");

    const message = document.getElementById("booking-message");
    if (message) {
      message.textContent = "🔐 Opening sign-in window...";
      message.style.color = "blue";
    }

    const firebase = await initFirebase();
    if (!firebase) {
      throw new Error("Firebase initialization failed");
    }

    const firebaseAuthModule = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
    const provider = new firebaseAuthModule.GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.events');
    provider.setCustomParameters({ prompt: 'select_account' });

    const result = await firebaseAuthModule.signInWithPopup(firebaseAuth, provider);
    const user = result.user;
    const idToken = await user.getIdToken();

    await handleFirebaseUser(user, idToken);

  } catch (error) {
    console.error("❌ Firebase sign-in error:", error);

    const message = document.getElementById("booking-message");
    if (message) {
      let errorMsg = error.message;
      if (error.code === 'auth/popup-blocked') {
        errorMsg = "Pop-up was blocked. Please allow pop-ups for this site and try again.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMsg = "Sign-in was cancelled. Please try again.";
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMsg = "This domain is not authorized for Google Sign-In. Please contact support.";
      }
      message.innerHTML = `❌ Sign-in failed: ${errorMsg}`;
      message.style.color = "red";
    }
  }
}

// Google One-Tap Sign-In callback
window.handleCredentialResponse = async (response) => {
  // FIX 3: Add verification lock
  if (isVerifying) {
    console.log("⚠️ Verification already in progress, skipping...");
    return;
  }

  try {
    console.log("🔐 Google One-Tap response received");

    // 1. Import Firebase Auth modules if not already loaded
    const { GoogleAuthProvider, signInWithCredential } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');

    // 2. Create a Firebase credential from the Google ID Token
    const credential = GoogleAuthProvider.credential(response.credential);

    // 3. Sign into Firebase with that credential
    console.log("🔥 Exchanging Google token for Firebase session...");
    const userCredential = await signInWithCredential(firebaseAuth, credential);
    const firebaseUser = userCredential.user;

    // 4. Get the ACTUAL Firebase ID Token
    const firebaseIdToken = await firebaseUser.getIdToken();

    console.log("📡 Verifying Firebase token with backend...");
    const verifyRes = await fetch(`${API_BASE}/api/auth/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${firebaseIdToken}`, // FIX 2 & FIX 1: Use correct variable
        "Accept": "application/json"
      },
      body: JSON.stringify({ idToken: firebaseIdToken }) // FIX 1: Use consistent variable name
    });

    console.log(`📥 Response status: ${verifyRes.status}`);

    if (!verifyRes.ok) {
      let errorMessage = `HTTP ${verifyRes.status}`;
      try {
        const errorData = await verifyRes.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        const errorText = await verifyRes.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await verifyRes.json();
    console.log("✅ Verification successful:", data.user.email);

    // Store user data
    localStorage.setItem("mindmate_id_token", data.token || firebaseIdToken);
    localStorage.setItem("mindmate_user", data.user.email);
    localStorage.setItem("mindmate_user_name", data.user.name);
    localStorage.setItem("mindmate_user_data", JSON.stringify(data.user));
    currentUser = data.user;

    // Hide login container
    const authContainer = document.getElementById("auth-container");
    if (authContainer) authContainer.style.display = "none";

    // Show user info
    const userInfoDiv = document.getElementById("user-info");
    if (userInfoDiv) {
      userInfoDiv.style.display = "block";
      userInfoDiv.innerHTML = `
        <div class="user-info-card">
          <p>✅ Signed in as: <strong>${data.user.name || data.user.email}</strong></p>
          <button id="logout-btn" class="logout-button">Sign Out</button>
        </div>
      `;

      document.getElementById("logout-btn")?.addEventListener("click", async () => {
        if (firebaseAuth) {
          await firebaseAuth.signOut();
        }
        localStorage.clear();
        window.location.reload();
      });
    }

    const message = document.getElementById("booking-message");
    if (message) {
      message.textContent = `✅ Welcome ${data.user.name || data.user.email}!`;
      message.style.color = "green";
      setTimeout(() => message.textContent = "", 3000);
    }

    // Load therapists
    await loadTherapists();
    setupBookingForm();

  } catch (error) {
    console.error("❌ Sign-in error:", error);

    const message = document.getElementById("booking-message");
    if (message) {
      let errorMsg = error.message;
      if (error.message.includes('Failed to fetch')) {
        errorMsg = "Cannot connect to the server. Please check your internet connection or try again later.";
      }
      message.innerHTML = `❌ Sign-in failed: ${errorMsg}<br><small>Try clicking the "Alternative Sign-in" button below.</small>`;
      message.style.color = "red";
    }

    // Show fallback button
    const fallback = document.getElementById("firebase-auth-fallback");
    if (fallback) fallback.style.display = "block";
  }
};

// Initialize Google One-Tap Sign-In
function initGoogleSignIn() {
  console.log("🔧 Initializing Google One-Tap Sign-In...");

  if (!window.google || !window.google.accounts) {
    console.log("⏳ Google Identity Services not ready, retrying in 1 second...");
    setTimeout(initGoogleSignIn, 1000);
    return;
  }

  console.log("✅ Google Identity Services is ready!");

  const clientId = "443513007248-6dpgna6tkrjfgaugtranhbs3tvdb50p6.apps.googleusercontent.com";

  // Initialize with more conservative settings
  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: window.handleCredentialResponse,
    auto_select: false,
    cancel_on_tap_outside: true,
    // Remove itp_support if it's causing issues
    // itp_support: true
  });

  // Only render the button if the element exists
  const buttonElement = document.getElementById("google-signin-button");
  if (buttonElement) {
    window.google.accounts.id.renderButton(
      buttonElement,
      {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left"
      }
    );
    console.log("✅ Google Sign-In button rendered");
  } else {
    console.warn("⚠️ Google sign-in button element not found");
  }

  // Try to show One-Tap, but don't rely on it
  try {
    window.google.accounts.id.prompt();
    console.log("📱 One-Tap prompt displayed");
  } catch (promptError) {
    console.warn("⚠️ Could not display One-Tap prompt:", promptError);
  }
}

// Load therapists
async function loadTherapists() {
  try {
    const idToken = localStorage.getItem("mindmate_id_token");
    if (!idToken) {
      console.log("⚠️ No token found");
      return;
    }

    console.log("📡 Loading therapists...");
    const res = await fetch(`${API_BASE}/api/therapists/list`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const container = document.getElementById("therapist-list");

    if (!container) return;

    if (!data.therapists || data.therapists.length === 0) {
      container.innerHTML = '<p class="no-therapists">No therapists available at the moment. Please check back later.</p>';
      return;
    }

    console.log(`✅ Loaded ${data.therapists.length} therapists`);

    container.innerHTML = data.therapists.map(therapist => `
      <div class="therapist-card" data-id="${therapist.id}">
        <div class="therapist-header">
          <img src="${therapist.photo || '/images/default-therapist.jpg'}" 
               alt="${therapist.name}" 
               onerror="this.src='/images/default-therapist.jpg'">
          ${therapist.premiumOnly ? '<span class="premium-badge">⭐ Premium</span>' : ''}
        </div>
        <h3>${therapist.name}</h3>
        <p class="specialization">${therapist.specialization || 'Mental Health Professional'}</p>
        <p class="bio">${therapist.bio ? therapist.bio.substring(0, 100) : 'Experienced therapist dedicated to your mental wellness.'}...</p>
        <button class="select-therapist-btn" data-id="${therapist.id}">View Availability</button>
        <div class="available-slots" id="slots-${therapist.id}" style="display: none;">
          <h4>Available Slots</h4>
          <div class="slots-grid"></div>
        </div>
      </div>
    `).join("");

    // Add event listeners to select buttons
    document.querySelectorAll(".select-therapist-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const therapistId = btn.dataset.id;
        selectedTherapist = data.therapists.find(t => t.id === therapistId);
        await loadSlots(therapistId);

        const bookingForm = document.querySelector(".booking-form");
        if (bookingForm) {
          bookingForm.style.display = "block";
          const formTitle = bookingForm.querySelector("h2");
          if (formTitle) formTitle.textContent = `Book with ${selectedTherapist.name}`;
          bookingForm.scrollIntoView({ behavior: "smooth" });
        }
      });
    });
  } catch (err) {
    console.error("❌ Error loading therapists:", err);
    const container = document.getElementById("therapist-list");
    if (container) {
      container.innerHTML = '<p class="error">❌ Unable to load therapists. Please try again later.</p>';
    }
  }
}

async function fetchUserBookings() {
  try {
    const idToken = localStorage.getItem("mindmate_id_token");
    if (!idToken) return [];

    const res = await fetch(`${API_BASE}/api/appointments/user`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Accept': 'application/json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      return data.bookings || [];
    }
  } catch (err) {
    console.error("Error fetching bookings:", err);
  }
  return [];
}

async function loadUserBookings() {
  try {
    const idToken = localStorage.getItem("mindmate_id_token");
    if (!idToken) return;

    const res = await fetch(`${API_BASE}/api/appointments/user`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      console.warn("Warning: unable to load user bookings", res.status);
      return;
    }

    const data = await res.json();
    const bookingsContainer = document.getElementById("existing-bookings");
    const bookingsList = document.getElementById("bookings-list");

    if (data.bookings && data.bookings.length > 0) {
      if (bookingsContainer) bookingsContainer.style.display = "block";
      if (bookingsList) {
        bookingsList.innerHTML = data.bookings.map(booking => `
          <div class="booking-item">
            <p><strong>📅 ${booking.date}</strong> at <strong>⏰ ${booking.time}</strong></p>
            <p>👤 ${booking.therapistName || 'Therapist'}</p>
            <p>Status: ${booking.status || 'confirmed'}</p>
            <button type="button" onclick="cancelBooking('${booking.id}')" class="cancel-btn">Cancel</button>
          </div>
        `).join("");
      }
    } else {
      if (bookingsContainer) bookingsContainer.style.display = "none";
      if (bookingsList) bookingsList.innerHTML = "";
    }
  } catch (err) {
    console.error("Error loading bookings:", err);
  }
}

async function cancelBooking(bookingId) {
  if (!confirm("Are you sure you want to cancel this appointment?")) return;

  try {
    const idToken = localStorage.getItem("mindmate_id_token");
    if (!idToken) throw new Error("Not signed in");

    const res = await fetch(`${API_BASE}/api/appointments/cancel`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ bookingId })
    });

    if (res.ok) {
      alert("Appointment cancelled successfully!");
      await loadUserBookings();
      if (selectedTherapist) {
        await loadSlots(selectedTherapist.id);
      }
      return;
    }

    let errMsg = 'Unknown error';
    try {
      const data = await res.json();
      errMsg = data.error || errMsg;
    } catch (_) {
      errMsg = `Unexpected response from server (status ${res.status})`;
    }

    alert(`Failed to cancel: ${errMsg}`);
  } catch (err) {
    console.error("Error cancelling booking:", err);
    alert("Failed to cancel appointment");
  }
}

async function loadSlots(therapistId) {
  try {
    const idToken = localStorage.getItem("mindmate_id_token");
    const res = await fetch(`${API_BASE}/api/therapists/availability?therapistId=${therapistId}`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const slotsContainer = document.querySelector(`#slots-${therapistId} .slots-grid`);

    if (!slotsContainer) return;

    if (!data.slots || Object.keys(data.slots).length === 0) {
      slotsContainer.innerHTML = '<p>No available slots for the next 7 days.</p>';
      return;
    }

    const userBookings = await fetchUserBookings();
    const userBookedTimes = new Set(userBookings.map(booking => `${booking.date}|${booking.time}`));

    let slotsHtml = '';
    const sortedDates = Object.keys(data.slots).sort();

    for (const date of sortedDates) {
      const slots = data.slots[date];
      const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });

      slotsHtml += `
        <div class="date-group">
          <h5>${formattedDate}</h5>
          <div class="time-slots">
      `;

      slots.forEach(slot => {
        const isUserBooked = userBookedTimes.has(`${date}|${slot.time}`);
        const disabledAttrs = isUserBooked ? 'disabled aria-disabled="true"' : '';
        const extraClass = isUserBooked ? 'time-slot booked-slot' : 'time-slot';
        const note = isUserBooked ? ' (Already booked)' : '';

        slotsHtml += `
          <button class="${extraClass}" 
                  data-slot-id="${slot.id}" 
                  data-time="${slot.time}" 
                  data-date="${date}" ${disabledAttrs}>
            ${slot.time}${note}
          </button>
        `;
      });

      slotsHtml += `</div></div>`;
    }

    slotsContainer.innerHTML = slotsHtml;

    const slotsDiv = document.getElementById(`slots-${therapistId}`);
    if (slotsDiv) slotsDiv.style.display = "block";

    document.querySelectorAll(".time-slot").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;

        document.querySelectorAll(".time-slot").forEach(s => s.classList.remove("selected"));
        btn.classList.add("selected");

        selectedSlot = {
          id: btn.dataset.slotId,
          time: btn.dataset.time,
          date: btn.dataset.date
        };

        const dateInput = document.getElementById("date");
        const timeInput = document.getElementById("time");
        if (dateInput) dateInput.value = selectedSlot.date;
        if (timeInput) timeInput.value = selectedSlot.time;
      });
    });
  } catch (err) {
    console.error("Error loading slots:", err);
    const slotsContainer = document.querySelector(`#slots-${therapistId} .slots-grid`);
    if (slotsContainer) {
      slotsContainer.innerHTML = '<p class="error">❌ Failed to load availability. Please try again.</p>';
    }
  }
}

function setupBookingForm() {
  const form = document.querySelector(".booking-form form");
  const message = document.getElementById("booking-message");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Validation: Ensure a slot is actually picked
    if (!selectedSlot || !selectedTherapist) {
      if (message) {
        message.textContent = "❌ Please select a therapist and a time slot first.";
        message.style.color = "red";
      }
      return;
    }

    // 2. Auth Check: Ensure token exists
    const idToken = localStorage.getItem("mindmate_id_token");
    if (!idToken) {
      if (message) {
        message.textContent = "❌ Please sign in to book an appointment.";
        message.style.color = "red";
      }
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;

    // 3. UI Lock: Disable button immediately to prevent double-booking (409 errors)
    submitBtn.disabled = true;
    submitBtn.textContent = "Booking...";

    if (message) {
      message.textContent = "📅 Confirming your appointment...";
      message.style.color = "#555"; // Neutral color during processing
    }

    const body = {
      fullname: form.fullname.value,
      email: form.email.value,
      type: form.type.value,
      date: selectedSlot.date,
      time: selectedSlot.time,
      notes: form.notes.value,
      therapistId: selectedTherapist.id,
      slotId: selectedSlot.id
    };

    console.log("📤 Booking request payload:", {
      fullname: form.fullname.value,
      email: form.email.value,
      type: form.type.value,
      date: selectedSlot.date,
      time: selectedSlot.time,
      therapistId: selectedTherapist.id,
      slotId: selectedSlot.id
    });

    try {
      const res = await fetch(`${API_BASE}/api/appointments/book`, {
        method: "POST",
        mode: 'cors',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      // Handle specific HTTP errors
      if (!res.ok) {
        if (res.status === 409) {
          if (data.error === "This time slot has already been booked") {
            throw new Error("This time slot was just booked by someone else. Please pick another.");
          } else if (data.error === "You already have a booking at this time") {
            const existingBookings = await fetchUserBookings();
            const conflictingBooking = existingBookings.find((booking) => {
              if (!booking || !booking.date || !booking.time) return false;
              return booking.date === selectedSlot.date && booking.time === selectedSlot.time;
            });

            let errorMsg = "You already have a booking scheduled at this time.";
            if (conflictingBooking) {
              errorMsg += `\n\nExisting booking:\n📅 ${conflictingBooking.date}\n⏰ ${conflictingBooking.time}\n👤 ${conflictingBooking.therapistName || 'Therapist'}\n\nPlease select a different time or cancel your existing booking.`;
            }

            throw new Error(errorMsg);
          } else {
            throw new Error(data.error || "This slot is no longer available. Please pick another.");
          }
        }
        throw new Error(data.error || "Booking failed");
      }

      // 4. Success Execution
      if (message) {
        message.innerHTML = `✅ ${data.message || 'Appointment Confirmed!'}<br><small>A confirmation email has been sent.</small>`;
        message.style.color = "green";
      }

      // Reset form and clear UI selections
      form.reset();
      selectedSlot = null;
      document.querySelectorAll(".time-slot").forEach(s => s.classList.remove("selected"));

      // 5. Refresh Available Slots and booking list
      try {
        await loadSlots(selectedTherapist.id);
        await loadUserBookings();
      } catch (refreshErr) {
        console.error("Error refreshing slots/bookings:", refreshErr);
      }

      // Success: Change button text but keep it disabled to prevent a duplicate second booking
      submitBtn.textContent = "Booked!";

    } catch (err) {
      // 6. Error Handling
      console.error("Booking Error:", err);
      if (message) {
        message.textContent = `❌ ${err.message}`;
        message.style.color = "red";
      }

      // Re-enable button ONLY on error so the user can try again
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });
}

// Setup fallback sign-in button
function setupFallbackSignIn() {
  const fallbackBtn = document.getElementById("firebase-login-btn");
  if (fallbackBtn) {
    fallbackBtn.addEventListener("click", async () => {
      await signInWithFirebase();
    });
  }
}

// Initialize the page when DOM is ready
document.addEventListener("DOMContentLoaded", async () => {
  console.log("📄 Page loaded, checking auth state...");

  const idToken = localStorage.getItem("mindmate_id_token");
  const userEmail = localStorage.getItem("mindmate_user");

  if (idToken && userEmail) {
    console.log(`✅ User already signed in: ${userEmail}`);

    const authContainer = document.getElementById("auth-container");
    if (authContainer) authContainer.style.display = "none";

    const userInfoDiv = document.getElementById("user-info");
    if (userInfoDiv) {
      userInfoDiv.style.display = "block";
      userInfoDiv.innerHTML = `
        <div class="user-info-card">
          <p>✅ Signed in as: <strong>${localStorage.getItem("mindmate_user_name") || userEmail}</strong></p>
          <button id="logout-btn" class="logout-button">Sign Out</button>
        </div>
      `;

      document.getElementById("logout-btn")?.addEventListener("click", async () => {
        if (firebaseAuth) {
          await firebaseAuth.signOut();
        }
        localStorage.clear();
        window.location.reload();
      });
    }

    // Initialize Firebase for logout functionality
    await initFirebase();
    await loadTherapists();
    setupBookingForm();
    await loadUserBookings();
  } else {
    console.log("🔐 User not signed in, initializing sign-in methods...");

    // Initialize Firebase for sign-in
    await initFirebase();

    // Only initialize Google Sign-In if we're on a valid domain
    const allowedDomains = ['mindmate-sum.vercel.app', 'mindmate-navy.vercel.app', 'mindmate.vercel.app'];
    const currentHost = window.location.hostname;

    if (allowedDomains.includes(currentHost) || currentHost === 'localhost') {
      initGoogleSignIn();
    } else {
      console.warn(`⚠️ Domain ${currentHost} not in allowed list for One-Tap. Using fallback only.`);
    }

    setupFallbackSignIn();

    const therapistSelector = document.querySelector(".therapist-selector");
    if (therapistSelector) {
      therapistSelector.innerHTML = `
        <div class="login-prompt">
          <p>🔐 Please sign in to book an appointment with our therapists.</p>
        </div>
      `;
    }
  }
});