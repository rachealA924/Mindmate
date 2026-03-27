# MindMate Backend — Setup Guide

## Folder structure

```
your-project/
├── api/
│   ├── appointments/
│   │   ├── book.js       ← POST /api/appointments/book
│   │   └── list.js       ← GET  /api/appointments/list
│   ├── contact/
│   │   └── send.js       ← POST /api/contact/send
│   ├── analyze/
│   │   └── mood.js       ← POST /api/analyze/mood
│   └── auth/
│       └── verify.js     ← POST /api/auth/verify
├── lib/
│   ├── firebase-admin.js
│   └── auth-middleware.js
├── js/                   ← your existing frontend JS folder
│   ├── auth.js           ← REPLACE with updated version
│   ├── appointment.js    ← REPLACE with updated version
│   ├── sentiment.js      ← REPLACE with updated version
│   └── form-validation.js← REPLACE with updated version
├── css/
├── images/
├── index.html            ← all your HTML — UNCHANGED
├── package.json
├── vercel.json
├── .env.example
└── .gitignore
```

---

## Step 1 — Set up Firebase (Firestore + Admin SDK)

1. Go to [Firebase Console](https://console.firebase.google.com) → your **mindmate-467614** project
2. Click **Firestore Database** → **Create database** → choose **Production mode** → pick region `europe-west1` (closest to Kigali)
3. In Firestore, create these collections manually (just click "Start collection"):
   - `appointments`
   - `contact_messages`
   - `users`
   - `user_tokens`
4. Go to **Project Settings** → **Service Accounts** tab
5. Click **Generate new private key** → it downloads a JSON file
6. Open that JSON file — you need three values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

---

## Step 2 — Get Gmail App Password (for contact form emails)

1. Go to your Google Account → **Security**
2. Enable **2-Step Verification** if not already on
3. Search for **App Passwords** → create one named "MindMate"
4. Copy the 16-character password → this is your `EMAIL_PASS`

---

## Step 3 — Set up Firestore Security Rules

In Firebase Console → Firestore → **Rules**, paste this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only read/write their own profile
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // Users can only read their own appointments
    match /appointments/{docId} {
      allow read: if request.auth != null && resource.data.uid == request.auth.uid;
      allow write: if false; // backend only
    }

    // No client access to tokens or contact messages
    match /user_tokens/{uid} {
      allow read, write: if false;
    }

    match /contact_messages/{docId} {
      allow read, write: if false;
    }
  }
}
```

---

## Step 4 — Add environment variables to Vercel

1. Go to [vercel.com](https://vercel.com) → your MindMate project → **Settings** → **Environment Variables**
2. Add each of these (copy values from your Firebase service account JSON and Gmail):

| Name | Value |
|------|-------|
| `FIREBASE_PROJECT_ID` | `mindmate-467614` |
| `FIREBASE_CLIENT_EMAIL` | from service account JSON |
| `FIREBASE_PRIVATE_KEY` | from service account JSON (include the full key with `\n`) |
| `EMAIL_USER` | your Gmail address |
| `EMAIL_PASS` | your 16-char Gmail App Password |
| `EMAIL_RECEIVER` | email where contact messages are delivered |
| `ALLOWED_ORIGIN` | `https://mindmate.vercel.app` |

> ⚠️ Never commit `.env` to GitHub. The `.gitignore` already blocks it.

---

## Step 5 — Deploy to Vercel

```bash
# In your project root
npm install
npx vercel          # first deploy — follow the prompts
# or if already linked:
git push            # auto-deploys via GitHub integration
```

---

## Step 6 — Replace your frontend JS files

Copy the four updated JS files into your `js/` folder, replacing the old versions:

| File | What changed |
|------|-------------|
| `auth.js` | Sends ID token to backend for verification; no longer stores calendar token in localStorage |
| `appointment.js` | POSTs to `/api/appointments/book` with auth header |
| `sentiment.js` | POSTs text to `/api/analyze/mood` |
| `form-validation.js` | POSTs contact form to `/api/contact/send`; drops Formspree |

Also remove the `action="https://formspree.io/..."` attribute from your contact form in `contact.html` — the JS now handles submission.

---

## Security fixes applied

| Issue | Fix |
|-------|-----|
| Firebase API key exposed in `firebase-config.js` | Config is fine for client SDK — but Admin SDK keys are now server-only in `.env` |
| Google Calendar token in `localStorage` | Token saved to Firestore via backend; removed from client storage |
| Contact form going to third-party Formspree | Now handled entirely by your own backend |
| No server-side auth validation | All protected routes verify Firebase ID token before processing |
| Google Client ID exposed in HTML | This is acceptable for GSI — but consider moving it to a backend-rendered page later |

---

## API reference

| Method | Endpoint | Auth required | Description |
|--------|----------|--------------|-------------|
| POST | `/api/auth/verify` | No | Verify Google ID token, save user to Firestore |
| POST | `/api/appointments/book` | Yes | Save booking, create Calendar event |
| GET | `/api/appointments/list` | Yes | List user's bookings |
| POST | `/api/contact/send` | No | Save message, send email |
| POST | `/api/analyze/mood` | No | Sentiment analysis on text |