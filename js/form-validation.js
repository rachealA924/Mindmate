// form-validation.js  (UPDATED — replaces the old version)
// Sends contact form to backend API instead of Formspree

const API_BASE = "https://mindmate.vercel.app/api";

document.addEventListener("DOMContentLoaded", () => {
  // ─── General validation for all forms ─────────────────────────────────────
  document.querySelectorAll("form").forEach((form) => {
    // Skip the contact form — handled separately below
    if (form.closest(".contact-form")) return;

    form.addEventListener("submit", (e) => {
      const requiredFields = form.querySelectorAll("[required]");
      const emailField = form.querySelector('input[type="email"]');
      let isValid = true;

      requiredFields.forEach((field) => {
        if (!field.value.trim()) { field.classList.add("error"); isValid = false; }
        else field.classList.remove("error");
      });

      if (emailField && !/\S+@\S+\.\S+/.test(emailField.value)) {
        emailField.classList.add("error");
        isValid = false;
      }

      if (!isValid) {
        e.preventDefault();
        alert("⚠️ Please fill in all required fields correctly.");
      }
    });
  });

  // ─── Contact form → backend API ───────────────────────────────────────────
  const contactForm = document.querySelector(".contact-form form");
  const formStatus = document.getElementById("form-status");

  if (!contactForm) return;

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = contactForm.querySelector("#name")?.value.trim();
    const email = contactForm.querySelector("#email")?.value.trim();
    const message = contactForm.querySelector("#message")?.value.trim();

    if (!name || !email || !message) {
      if (formStatus) { formStatus.textContent = "⚠️ Please fill in all fields."; formStatus.style.color = "orange"; }
      return;
    }

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    if (formStatus) { formStatus.textContent = "📤 Sending your message..."; formStatus.style.color = "#007bff"; }

    try {
      const res = await fetch(`${API_BASE}/contact/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");

      if (formStatus) { formStatus.textContent = "✅ Thank you! Your message has been sent."; formStatus.style.color = "green"; }
      contactForm.reset();
    } catch (err) {
      if (formStatus) { formStatus.textContent = `❌ ${err.message}`; formStatus.style.color = "red"; }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Message";
    }
  });
});