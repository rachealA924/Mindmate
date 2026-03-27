// appointment.js  (UPDATED — replaces the old version)
// Submits booking to the backend API instead of just showing a message

const API_BASE = "https://mindmate.vercel.app/api";

// Google Sign-In callback (still needed for the GSI button)
let userEmail = null;
window.handleCredentialResponse = function (response) {
  const payload = JSON.parse(atob(response.credential.split(".")[1]));
  userEmail = payload.email;
  const msg = document.getElementById("booking-message");
  if (msg) { msg.textContent = `Signed in as ${userEmail}`; msg.style.color = "var(--color-text-success, green)"; }
};

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".booking-form form");
  const message = document.getElementById("booking-message");

  if (!form || !message) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const idToken = localStorage.getItem("mindmate_id_token");
    if (!idToken) {
      message.textContent = "❌ Please sign in with Google before booking.";
      message.style.color = "red";
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Booking...";
    message.textContent = "";

    const body = {
      fullname: form.fullname.value,
      email: form.email.value,
      type: form.type.value,
      date: form.date.value,
      time: form.time.value,
      notes: form.notes.value,
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

      message.textContent = `✅ ${data.message}`;
      message.style.color = "green";
      form.reset();
    } catch (err) {
      message.textContent = `❌ ${err.message}`;
      message.style.color = "red";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Book Appointment";
    }
  });
});