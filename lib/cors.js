// lib/cors.js

/**
 * Enhanced CORS configuration to handle strict browser preflight checks
 * and multiple development/production origins.
 */
const allowedOrigins = [
  // Local development
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5500', // Added explicitly to match your logs
  // Production domains
  'https://mindmate.vercel.app',
  'https://mindmate-git-main.vercel.app',
  'https://mindmate-sum.vercel.app',
  'https://mindmate-navy.vercel.app',
  'https://mindmate-sum.vercel.app'
];

export function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  
  // Log for debugging
  console.log('CORS Request from origin:', origin);
  
  // 1. Handle Access-Control-Allow-Origin
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } 
  // Improved check for localhost/127.0.0.1 variants
  else if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    console.log('✅ Allowed local development origin:', origin);
  } 
  else {
    // Fallback for non-production environments
    if (process.env.VERCEL_ENV !== 'production') {
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (origin) {
      console.warn('⚠️ Rejected CORS origin in production:', origin);
    }
  }
  
  // 2. Standard CORS Headers
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
}

export function handleCors(req, res) {
  setCorsHeaders(req, res);
  
  // 3. Robust Preflight handling
  // Explicitly setting status 204 and Content-Length 0 for OPTIONS requests
  if (req.method === 'OPTIONS') {
    console.log('🔄 Handling OPTIONS preflight for:', req.url);
    res.statusCode = 204;
    res.setHeader('Content-Length', '0');
    res.end();
    return true;
  }
  
  return false;
}