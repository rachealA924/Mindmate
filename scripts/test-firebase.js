// scripts/test-firebase.js
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testFirebase() {
  try {
    console.log('🔍 Testing Firebase connection...');
    
    // Try to load service account
    let serviceAccount;
    try {
      const filePath = join(__dirname, '../service-account-key.json');
      const fileContent = readFileSync(filePath, 'utf8');
      serviceAccount = JSON.parse(fileContent);
      console.log('✅ Found service account file');
    } catch (error) {
      console.error('❌ Could not find service-account-key.json');
      console.log('Please download it from Firebase Console and place it in the project root');
      process.exit(1);
    }
    
    // Initialize Firebase
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase initialized');
    }
    
    const db = admin.firestore();
    
    // Test connection by writing a test document
    console.log('📝 Testing write operation...');
    const testRef = db.collection('test').doc('connection-test');
    await testRef.set({
      message: 'Connection successful!',
      timestamp: new Date().toISOString()
    });
    console.log('✅ Successfully wrote to Firestore');
    
    // Test reading
    console.log('📖 Testing read operation...');
    const doc = await testRef.get();
    console.log('✅ Successfully read from Firestore:', doc.data());
    
    // Clean up
    await testRef.delete();
    console.log('✅ Cleaned up test data');
    
    console.log('\n✨ Firebase connection is working perfectly!');
    console.log('You can now run the seed script: npm run seed');
    
  } catch (error) {
    console.error('\n❌ Firebase connection failed:', error.message);
    console.error('\nChecklist:');
    console.error('1. Is your service-account-key.json file in the project root?');
    console.error('2. Does the service account have proper permissions?');
    console.error('3. Is your Firebase project active?');
    console.error('4. Check if you need to enable Firestore in Firebase Console');
  }
}

testFirebase();