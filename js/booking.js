// booking.js
// ✅ Booking form logic (API placeholder for backend integration)
// COMMENTED OUT - Using appointment.js instead for Google Calendar integration

/*
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".booking-form form");
  const message = document.getElementById("booking-message");
  if (!form || !message) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    message.textContent = "⏳ Sending booking request...";

    // ✅ Gather form data
    const bookingData = {
      name: form.fullname.value,
      email: form.email.value,
      date: form.date.value,
      time: form.time.value,
      notes: form.notes.value,
    };

    try {
      // 🔒 Placeholder for future backend call
      // In production: send bookingData to your backend
      console.log("Booking data (to send to backend):", bookingData);

      message.textContent = "✅ Booking submitted! We'll contact you soon.";
      form.reset();
    } catch (err) {
      message.textContent = "❌ Booking failed. Please try again.";
    }
  });
});
*/
