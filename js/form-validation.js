// form-validation.js
// ✅ Enhanced form validation with proper Formspree integration

document.addEventListener("DOMContentLoaded", () => {
  const forms = document.querySelectorAll("form");

  forms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      const requiredFields = form.querySelectorAll("[required]");
      const emailField = form.querySelector('input[type="email"]');

      let isValid = true;

      // ✅ Check required fields
      requiredFields.forEach((field) => {
        if (!field.value.trim()) {
          field.classList.add("error");
          isValid = false;
        } else {
          field.classList.remove("error");
        }
      });

      // ✅ Validate email format if present
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
});

// Enhanced Formspree integration for contact form
document.addEventListener("DOMContentLoaded", function () {
  const contactForm = document.querySelector(".contact-form form");
  const formStatus = document.getElementById("form-status");

  if (contactForm) {
    // Show loading state when form is submitted
    contactForm.addEventListener("submit", function (e) {
      // Don't prevent default - let Formspree handle it
      const submitButton = contactForm.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      
      // Show loading state
      submitButton.textContent = "Sending...";
      submitButton.disabled = true;
      
      if (formStatus) {
        formStatus.textContent = "📤 Sending your message...";
        formStatus.style.color = "#007bff";
      }
    });

    // Handle Formspree response
    window.addEventListener('pageshow', function(event) {
      if (event.persisted) {
        // Page was loaded from back-forward cache
        return;
      }
      
      // Check for Formspree success/error parameters in URL
      const urlParams = new URLSearchParams(window.location.search);
      const formspreeStatus = urlParams.get('_next');
      
      if (formspreeStatus && formStatus) {
        // Formspree redirected back to the page
        formStatus.textContent = "✅ Thank you! Your message has been sent successfully.";
        formStatus.style.color = "#28a745";
        
        // Clear the form
        contactForm.reset();
        
        // Clear the URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    });
  }
});

