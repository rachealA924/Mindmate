# MINDMATE – MENTAL HEALTH SUPPORT APP

## TABLE OF CONTENTS
1. Overview
2. Features
3. Demo
4. Technologies Used
5. API Integration
6. Local Development Setup
7. Deployment
8. Project Structure
9. Challenges and Solutions
10. Credits and Acknowledgments

## 1. OVERVIEW
MindMate is an interactive mental health support web application designed to help users assess their emotional state, schedule therapy sessions, and access motivational content.

By integrating multiple APIs, the app provides sentiment analysis of user inputs, motivational quotes, and a seamless appointment booking system using Google Calendar.

**Important Disclaimer:** This application is for educational purposes only and should not replace professional mental health services. Always seek qualified help for serious mental health concerns.

## 2. FEATURES
- **2.1 Mood & Sentiment Check Tool:** Users type their feelings, and the app runs a sentiment analysis via Text Analysis API, Hugging Face API, and OpenAI for deeper insights.
- **2.2 Appointment Booking System:** Integrated with Google Calendar API to schedule sessions with therapists directly.
- **2.3 Motivational Quotes API:** Fetches daily motivational and wellness quotes for encouragement.
- **2.4 Light/Dark Mode Toggle:** Accessibility-friendly theme switcher.
- **2.5 Responsive Design:** Mobile-first design to ensure smooth access across devices.

## 3. DEMO
A link to a demo video (demonstrating how to use application locally and how to access it online): If it fails to play, copy the link manually and run it in a new tab:
- 🎥 Demo Video Link: 
- 🌐 Live Mindmate App: https://mindmate-navy.vercel.app/ 

## 4. TECHNOLOGIES USED
### 4.1 Frontend:
- HTML (page structure)
- CSS (styling & animations)
- JavaScript (API calls, sentiment processing, booking logic)

### 4.2 API Integrations:
- Zen Quotes API (Rapid API)
- Text Analysis API
- Hugging Face API (basic sentiment)
- Sentiment Analysis API (REST-based)
- OpenAI API (for conversational and emotional analysis)
- Google Calendar API (for therapist bookings)

## 5. API INTEGRATION
The application integrates multiple APIs to provide rich features:

- Text Analysis API – https://textanalysisapi.com/ Used for processing user text and extracting sentiment tone.
- Sentiment Analysis API – https://rapidapi.com/twinword/api/sentiment-analysis Provides a REST endpoint for positive/neutral/negative sentiment detection.
- Hugging Face API – https://huggingface.co/inference-api Offers deeper NLP analysis and contextual understanding.
- OpenAI API – https://platform.openai.com/docs/ Used for generating empathetic responses and natural language insights.
- Google Calendar API – https://developers.google.com/calendar Enables booking and managing therapy sessions within the app.
- ZenQuotes API – https://zenquotes.io/ Supplies motivational quotes displayed in the app.

## 6. LOCAL DEVELOPMENT SETUP
Follow these steps to run MindMate locally:

### Prerequisites
- Node.js 18+ installed
- npm (comes with Node.js)
- Git installed
- Internet connection (required for API calls and Google auth)

### Step-by-step run locally
1. **Clone the repo:**
   ```bash
   git clone https://github.com/rachealA924/Mindmate.git
   cd Mindmate
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Ensure Firebase service account key is present (if required):**
   - File: `service-account-key.json`
   - This repository includes a file placeholder.

4. **Start the server:**
   ```bash
   npm start
   # or
   node server.js
   ```

5. **Open the app:**
   - Visit: `http://localhost:5000`

6. **Operation checks:**
   - Firebase login/sign-out on `appointments.html`
   - Therapist appointment booking and cancellation
   - Mood sentiment analysis on `index.html`
   - Self-check assessment on `self-check.html`

### Troubleshooting
- If Google One-Tap is blocked, use fallback button.
- If mood endpoint returns 429 (rate limit), wait and retry.
- If hard reload needed, clear browser cache and re-run auth.

### Alternative static preview (browser-only)
1. Open `index.html` in Chrome.
2. For full bookings/API, use backend server route.

## 7. Deployment:
- Vercel

## 8. PROJECT STRUCTURE
- `index.html`, `about.html`, `appointments.html`, `self-check.html`, etc. (pages)
- `css/style.css` (app styles)
- `js/main.js` (global UI behavior, theme, navigation)
- `js/appointment.js` (auth, therapist + booking flows)
- `js/sentiment.js` (mood analysis)
- `js/self-check.js` (quiz and recommendations)
- `js/calendar.js` / other js files for calendar features
- `api/` (backend routes for auth, appointments, therapists, analysis)
- `lib/` (middleware, firebase auth, CORS, rate-limit configs)
- `server.js` (server entrypoint)
- `cron/generate-slots.js` (slot generation task)
- `service-account-key.json` (Firebase service account credentials)
- `README.md` (project documentation)

## 9. CHALLENGES AND SOLUTIONS
- 🔴 Multiple API Rate Limits Challenge: Free-tier APIs imposed strict call limits. Solution: Implemented caching & fallback messages to reduce unnecessary API calls.
- 🔴 Google Calendar Authentication Issues Challenge: OAuth setup required precise redirect URIs. Solution: Configured correct authorized domains and tested with local + deployed servers.

## 10. CREDITS AND ACKNOWLEDGMENTS
APIs Used:
- Text Analysis API – https://textanalysisapi.com/
- Sentiment Analysis API – https://rapidapi.com/twinword/api/sentiment-analysis
- Hugging Face API – https://huggingface.co/inference-api
- OpenAI API – https://platform.openai.com/docs/
- Google Calendar API – https://developers.google.com/calendar
- ZenQuotes API – https://zenquotes.io/

Special thanks to:
- API developers for free-tier access.



