let userEmail = null;

function handleCredentialResponse(response) {
  const base64Url = response.credential.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  ).join(''));
  const userObject = JSON.parse(jsonPayload);

  userEmail = userObject.email;

  const messageDiv = document.getElementById('booking-message');
  messageDiv.textContent = `Signed in as ${userEmail}`;
  messageDiv.style.color = 'lightgreen';
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".booking-form form");
  const message = document.getElementById("booking-message");

  if (!form || !message) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!userEmail) {
      message.textContent = "❌ Please sign in with Google before booking.";
      message.style.color = 'red';
      return;
    }

    // Collect form data
    const name = form.fullname.value;
    const email = form.email.value;
    const date = form.date.value;
    const time = form.time.value;
    const notes = form.notes.value;

    // Here you would normally send this data to your backend or API
    // For now, just show a success message

    message.textContent = `✅ Appointment booked for ${name} (${email}) on ${date} at ${time}.`;
    message.style.color = 'lightgreen';

    form.reset();
  });
});
