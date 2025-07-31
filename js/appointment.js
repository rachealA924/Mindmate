let googleAccessToken = null;

window.onload = function() {
  const googleBtn = document.getElementById('google-auth-btn');
  if (googleBtn && window.google && window.google.accounts && window.google.accounts.oauth2) {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: '443513007248-6dpgna6tkrjfgaugtranhbs3tvdb50p6.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/calendar',
      callback: (tokenResponse) => {
        googleAccessToken = tokenResponse.access_token;
        document.getElementById('booking-message').textContent = 'Signed in with Google! You can now book.';
      },
    });
    googleBtn.onclick = () => {
      client.requestAccessToken();
    };
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".booking-form form");
  const message = document.getElementById("booking-message");
  if (!form || !message) return;

  form.addEventListener("submit", async function(e) {
    e.preventDefault();

    if (!googleAccessToken) {
      message.textContent = "Please sign in with Google before booking.";
      return;
    }

    // Collect form data
    const name = form.fullname.value;
    const email = form.email.value;
    const date = form.date.value;
    const time = form.time.value;
    const notes = form.notes.value;

    // Prepare event details for RapidAPI Google Calendar MCP
    const event = {
      type: 'create_event',
      calendarId: 'primary',
      summary: `Appointment with ${name}`,
      description: notes,
      start: { dateTime: `${date}T${time}:00` },
      end: { dateTime: `${date}T${time}:30` },
      attendees: [{ email }]
    };

    // Call Google Calendar API via RapidAPI
    try {
      const response = await fetch("https://google-calendar-mcp.p.rapidapi.com/calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-key": "b89332d4e4msh6f72d3684896257p1c803bjsn4952a0000807",
          "x-rapidapi-host": "google-calendar-mcp.p.rapidapi.com",
          "X-Google-Calendar-Token": googleAccessToken
        },
        body: JSON.stringify(event)
      });
      const result = await response.json();
      if (result.id) {
        message.textContent = "✅Booking submitted! We'll contact you soon.";
        form.reset();
      } else {
        message.textContent = "❌Booking failed. Please try again.";
      }
    } catch (err) {
      message.textContent = "Error connecting to booking API.";
    }
  });
});