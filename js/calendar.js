async function createCalendarEvent(summary, date, time) {
  const token = localStorage.getItem("google_calendar_token");
  
  if (!token) {
    console.error("No access token found.");
    return false;
  }

  const startDateTime = new Date(`${date}T${time}:00`);
  const endDateTime = new Date(startDateTime.getTime() + (60 * 60 * 1000));

  const event = {
    'summary': `MindMate Session: ${summary}`,
    'description': 'Mental wellness consultation booked via MindMate App.',
    'start': { 
      'dateTime': startDateTime.toISOString(), 
      'timeZone': 'Africa/Kigali' 
    },
    'end': { 
      'dateTime': endDateTime.toISOString(), 
      'timeZone': 'Africa/Kigali' 
    }
  };

  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(event)
    });

    return response.ok;
  } catch (error) {
    console.error("Calendar API Error:", error);
    return false;
  }
}