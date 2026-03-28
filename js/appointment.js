// js/appointment.js - Simplified version
const API_BASE = "https://mindmate.vercel.app/api";
let selectedTherapist = null;
let selectedSlot = null;
let currentUser = null;

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Appointment page loaded");
  
  // Check if user is signed in
  const idToken = localStorage.getItem("mindmate_id_token");
  const userEmail = localStorage.getItem("mindmate_user");
  
  if (idToken && userEmail) {
    console.log("User is signed in:", userEmail);
    
    // Hide login container
    const authContainer = document.getElementById("auth-container");
    if (authContainer) authContainer.style.display = "none";
    
    // Show user info
    const userInfoDiv = document.getElementById("user-info");
    if (userInfoDiv) {
      userInfoDiv.style.display = "block";
      userInfoDiv.innerHTML = `
        <div class="user-info-card">
          <p>✅ Signed in as: <strong>${localStorage.getItem("mindmate_user_name") || userEmail}</strong></p>
          <button id="logout-btn" class="logout-button">Sign Out</button>
        </div>
      `;
      
      document.getElementById("logout-btn")?.addEventListener("click", () => {
        localStorage.clear();
        window.location.reload();
      });
    }
    
    await loadTherapists();
    setupBookingForm();
  } else {
    console.log("User not signed in, showing login prompt");
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

async function loadTherapists() {
  try {
    const idToken = localStorage.getItem("mindmate_id_token");
    if (!idToken) return;
    
    console.log("Loading therapists...");
    const res = await fetch(`${API_BASE}/therapists/list`, {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    const data = await res.json();
    const container = document.getElementById("therapist-list");
    
    if (!container) return;
    
    if (!data.therapists || data.therapists.length === 0) {
      container.innerHTML = '<p class="no-therapists">No therapists available at the moment. Please check back later.</p>';
      return;
    }
    
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
        
        // Load slots for this therapist
        await loadSlots(therapistId);
        
        // Show booking form
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
    console.error("Error loading therapists:", err);
    const container = document.getElementById("therapist-list");
    if (container) {
      container.innerHTML = '<p class="error">❌ Unable to load therapists. Please try again later.</p>';
    }
  }
}

async function loadSlots(therapistId) {
  try {
    const idToken = localStorage.getItem("mindmate_id_token");
    const res = await fetch(`${API_BASE}/therapists/availability?therapistId=${therapistId}`, {
      headers: {
        Authorization: `Bearer ${idToken}`
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
    
    // Display slots grouped by date
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
        slotsHtml += `
          <button class="time-slot" 
                  data-slot-id="${slot.id}" 
                  data-time="${slot.time}" 
                  data-date="${date}">
            ${slot.time}
          </button>
        `;
      });
      
      slotsHtml += `</div></div>`;
    }
    
    slotsContainer.innerHTML = slotsHtml;
    
    // Show slots container
    const slotsDiv = document.getElementById(`slots-${therapistId}`);
    if (slotsDiv) slotsDiv.style.display = "block";
    
    // Add time slot click handlers
    document.querySelectorAll(".time-slot").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".time-slot").forEach(s => s.classList.remove("selected"));
        btn.classList.add("selected");
        
        selectedSlot = {
          id: btn.dataset.slotId,
          time: btn.dataset.time,
          date: btn.dataset.date
        };
        
        // Pre-fill form
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
    
    if (!selectedSlot) {
      if (message) {
        message.textContent = "❌ Please select a time slot first.";
        message.style.color = "red";
      }
      return;
    }
    
    const idToken = localStorage.getItem("mindmate_id_token");
    if (!idToken) {
      if (message) {
        message.textContent = "❌ Please sign in to book an appointment.";
        message.style.color = "red";
      }
      return;
    }
    
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Booking...";
    if (message) message.textContent = "📅 Confirming your appointment...";
    
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
    
    try {
      const res = await fetch(`${API_BASE}/appointments/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Booking failed");
      
      if (message) {
        message.innerHTML = `✅ ${data.message}<br><small>Check your email for confirmation.</small>`;
        message.style.color = "green";
      }
      
      form.reset();
      selectedSlot = null;
      
      // Refresh slots
      if (selectedTherapist) {
        await loadSlots(selectedTherapist.id);
      }
      
      // Clear selected slot styling
      document.querySelectorAll(".time-slot").forEach(s => s.classList.remove("selected"));
      
    } catch (err) {
      if (message) {
        message.textContent = `❌ ${err.message}`;
        message.style.color = "red";
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Book Appointment";
    }
  });
}