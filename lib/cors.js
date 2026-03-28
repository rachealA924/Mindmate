// lib/cors.js
export const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5500',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:5501',
  'https://mindmate.vercel.app',
  'https://mindmate-git-main.vercel.app',
  'https://mindmate-sum.vercel.app',
  'https://mindmate-navy.vercel.app',
  'https://mindmate-7edwmn7oz-racheals-projects-cf6a576e.vercel.app'
];

export function setCORSHeaders(req, res) {
  const origin = req.headers.origin;
  
  // Allow if origin is in allowed list or is a localhost variant
  if (origin && (allowedOrigins.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export function handleCORS(req, res) {
  setCORSHeaders(req, res);
  
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }
  return false;
}