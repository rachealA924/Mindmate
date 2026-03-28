// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD0tGDETCjJX-LlNqFzqG3Umvmk8EYLUNs",
  authDomain: "mindmate-467614.firebaseapp.com",
  projectId: "mindmate-467614",
  storageBucket: "mindmate-467614.firebasestorage.app",
  messagingSenderId: "443513007248",
  appId: "1:443513007248:web:d1f919b600aaeac2f5bc15"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

provider.addScope('https://www.googleapis.com/auth/calendar.events');
provider.setCustomParameters({ prompt: 'select_account' });

// Store auth instance globally for sign out
window.firebaseAuth = auth;