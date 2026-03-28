import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Enable CORS for your frontend
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// Ping endpoint
app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong', timestamp: new Date().toISOString() });
});

// Auth verify endpoint
app.post('/api/auth/verify', (req, res) => {
  const { idToken } = req.body;
  
  if (!idToken) {
    return res.status(400).json({ error: 'idToken is required' });
  }
  
  // Mock successful verification
  res.json({
    success: true,
    user: {
      uid: 'mock-uid-123',
      email: 'test@mindmate.com',
      name: 'Test User',
      premium: false
    },
    token: idToken
  });
});

// Therapists list
app.get('/api/therapists/list', (req, res) => {
  const therapists = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      specialization: 'Clinical Psychologist',
      bio: 'Specializing in anxiety and depression with 10+ years of experience.',
      premiumOnly: false,
      photo: '/images/default-therapist.jpg'
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      specialization: 'Couples Therapist',
      bio: 'Expert in relationship counseling and family therapy.',
      premiumOnly: false,
      photo: '/images/default-therapist.jpg'
    },
    {
      id: '3',
      name: 'Dr. Emily Rodriguez',
      specialization: 'Trauma Specialist',
      bio: 'Certified in EMDR and trauma-focused CBT.',
      premiumOnly: true,
      photo: '/images/default-therapist.jpg'
    }
  ];
  
  res.json({ therapists, isPremium: false });
});

// Availability endpoint
app.get('/api/therapists/availability', (req, res) => {
  const { therapistId } = req.query;
  
  if (!therapistId) {
    return res.status(400).json({ error: 'therapistId is required' });
  }
  
  // Generate mock slots for next 7 days
  const slots = {};
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    const timeSlots = [];
    // Add time slots from 9 AM to 5 PM
    for (let hour = 9; hour <= 17; hour++) {
      if (hour !== 12) { // Skip lunch hour
        timeSlots.push({
          id: `${therapistId}-${dateStr}-${hour}`,
          time: `${hour.toString().padStart(2, '0')}:00`,
          duration: 60,
          price: 100
        });
      }
    }
    
    slots[dateStr] = timeSlots;
  }
  
  res.json({
    therapist: { id: therapistId },
    slots: slots,
    totalAvailable: Object.values(slots).flat().length
  });
});

// Book appointment endpoint
app.post('/api/appointments/book', (req, res) => {
  const { fullname, email, date, time, therapistId, slotId } = req.body;
  
  if (!fullname || !email || !date || !time || !therapistId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  res.json({
    success: true,
    bookingId: 'mock-booking-123',
    message: `✅ Appointment confirmed with ${fullname} on ${date} at ${time}. You'll receive a confirmation email shortly.`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`\n📡 Available endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api/test`);
  console.log(`   GET  http://localhost:${PORT}/api/ping`);
  console.log(`   POST http://localhost:${PORT}/api/auth/verify`);
  console.log(`   GET  http://localhost:${PORT}/api/therapists/list`);
  console.log(`   GET  http://localhost:${PORT}/api/therapists/availability?therapistId=1`);
  console.log(`   POST http://localhost:${PORT}/api/appointments/book`);
  console.log(`\n✅ CORS enabled for http://127.0.0.1:5500`);
  console.log(`🌐 Open your app at: http://127.0.0.1:5500/appointments.html`);
  console.log(`========================================\n`);
});
