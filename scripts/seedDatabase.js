// scripts/seedDatabase.js
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if we're running locally or in production
let serviceAccount;

try {
  // Try to read the service account file
  const filePath = join(__dirname, '../service-account-key.json');
  const fileContent = readFileSync(filePath, 'utf8');
  serviceAccount = JSON.parse(fileContent);
  console.log('✅ Found service account file');
} catch (error) {
  console.log('⚠️  No service account file found, checking environment variables...');
  
  // Check if we have environment variables (for production)
  if (process.env.FIREBASE_PRIVATE_KEY) {
    serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    };
    console.log('✅ Using environment variables');
  } else {
    console.error('❌ No Firebase credentials found!');
    console.error('Please either:');
    console.error('1. Place service-account-key.json in the project root');
    console.error('2. Set FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, and FIREBASE_PROJECT_ID environment variables');
    process.exit(1);
  }
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized');
}

const db = admin.firestore();

// Therapist data
const therapists = [
  {
    id: "therapist_sarah",
    name: "Dr. Sarah Kamau",
    specialization: "Anxiety & Depression Specialist",
    bio: "Licensed clinical psychologist with 10+ years of experience helping individuals overcome anxiety and depression using evidence-based approaches like CBT and mindfulness.",
    photo: "/images/therapist1.jpg",
    email: "sarah.kamau@mindmate.com",
    phone: "+254712345678",
    experience: 10,
    qualifications: ["PhD in Clinical Psychology", "Certified CBT Practitioner"],
    languages: ["English", "Swahili"],
    premiumOnly: false,
    workingHours: {
      monday: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
      tuesday: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
      wednesday: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
      thursday: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
      friday: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
      saturday: [],
      sunday: []
    },
    createdAt: new Date().toISOString()
  },
  {
    id: "therapist_james",
    name: "James Omondi, MA",
    specialization: "Trauma & PTSD Specialist",
    bio: "Certified trauma therapist specializing in EMDR and cognitive behavioral therapy. Experienced in helping individuals process trauma and build resilience.",
    photo: "/images/therapist2.jpg",
    email: "james.omondi@mindmate.com",
    phone: "+254723456789",
    experience: 8,
    qualifications: ["MA in Counseling Psychology", "EMDR Certified", "Trauma-Focused CBT"],
    languages: ["English", "Swahili", "Luo"],
    premiumOnly: false,
    workingHours: {
      monday: ["09:00", "10:00", "11:00", "14:00", "15:00"],
      tuesday: ["09:00", "10:00", "11:00", "14:00", "15:00"],
      wednesday: ["09:00", "10:00", "11:00", "14:00", "15:00"],
      thursday: ["09:00", "10:00", "11:00", "14:00", "15:00"],
      friday: ["09:00", "10:00", "11:00", "14:00", "15:00"],
      saturday: [],
      sunday: []
    },
    createdAt: new Date().toISOString()
  },
  {
    id: "therapist_amina",
    name: "Dr. Amina Hassan",
    specialization: "Couples & Family Therapy",
    bio: "Helping couples and families build stronger relationships through evidence-based approaches including Gottman Method and Emotionally Focused Therapy.",
    photo: "/images/therapist3.jpg",
    email: "amina.hassan@mindmate.com",
    phone: "+254734567890",
    experience: 12,
    qualifications: ["PhD in Marriage & Family Therapy", "Gottman Method Certified", "EFT Certified"],
    languages: ["English", "Swahili", "Somali"],
    premiumOnly: true,
    workingHours: {
      monday: ["10:00", "11:00", "14:00", "15:00", "16:00"],
      tuesday: ["10:00", "11:00", "14:00", "15:00", "16:00"],
      wednesday: ["10:00", "11:00", "14:00", "15:00", "16:00"],
      thursday: ["10:00", "11:00", "14:00", "15:00", "16:00"],
      friday: ["10:00", "11:00", "14:00", "15:00", "16:00"],
      saturday: [],
      sunday: []
    },
    createdAt: new Date().toISOString()
  }
];

// Generate appointment slots for next 30 days
async function generateAppointmentSlots(therapist, daysAhead = 30) {
  const slots = [];
  const startDate = new Date();
  
  for (let i = 0; i < daysAhead; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }
    
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
    const availableSlots = therapist.workingHours[dayName];
    
    if (availableSlots && availableSlots.length > 0) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      for (const time of availableSlots) {
        // Check if slot already exists (to avoid duplicates)
        const existingSlot = await db.collection('appointment_slots')
          .where('therapistId', '==', therapist.id)
          .where('date', '==', dateStr)
          .where('time', '==', time)
          .get();
        
        if (existingSlot.empty) {
          slots.push({
            therapistId: therapist.id,
            therapistName: therapist.name,
            date: dateStr,
            time: time,
            isBooked: false,
            type: therapist.specialization.includes('Couples') ? 'couples' : 'individual',
            duration: 60,
            price: therapist.premiumOnly ? 50 : 30,
            createdAt: new Date().toISOString()
          });
        }
      }
    }
  }
  
  return slots;
}

// Seed the database
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    console.log('====================================');
    
    for (const therapist of therapists) {
      console.log(`\n📋 Processing: ${therapist.name}`);
      
      // Check if therapist already exists
      const therapistDoc = await db.collection('therapists').doc(therapist.id).get();
      
      if (!therapistDoc.exists) {
        // Add therapist
        await db.collection('therapists').doc(therapist.id).set(therapist);
        console.log(`   ✅ Added therapist: ${therapist.name}`);
        
        // Generate appointment slots
        console.log(`   📅 Generating appointment slots...`);
        const slots = await generateAppointmentSlots(therapist, 30);
        
        if (slots.length > 0) {
          // Batch write slots to Firestore
          const batch = db.batch();
          for (const slot of slots) {
            const slotRef = db.collection('appointment_slots').doc();
            batch.set(slotRef, slot);
          }
          await batch.commit();
          console.log(`   📆 Added ${slots.length} appointment slots for ${therapist.name}`);
        } else {
          console.log(`   ⚠️  No slots generated for ${therapist.name}`);
        }
      } else {
        console.log(`   ⏭️  Therapist already exists, skipping...`);
      }
    }
    
    console.log('\n====================================');
    console.log('✨ Database seeding completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Check your Firestore console to verify the data');
    console.log('2. Deploy your app to Vercel: npm run deploy');
    console.log('3. Test the therapist listing and booking flow');
    
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    console.error('\nTroubleshooting:');
    console.error('- Make sure you have the correct service account key');
    console.error('- Check that Firebase project is active');
    console.error('- Verify network connection');
    process.exit(1);
  }
}

// Run the seeding
seedDatabase();