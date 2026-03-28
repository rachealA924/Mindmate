// lib/cors.js
const allowedOrigins = [
  // Local development
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5500',
  // Production domains
  'https://mindmate.vercel.app',
  'https://mindmate-git-main.vercel.app',
  'https://mindmate-sum.vercel.app',
  'https://mindmate-navy.vercel.app'
];

export function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  
  // Log for debugging
  console.log('CORS Request from origin:', origin);
  console.log('Request method:', req.method);
  console.log('Request path:', req.url);
  
  // Check if origin is explicitly allowed
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } 
  // For development, allow any localhost origin
  else if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    console.log('✅ Allowed localhost origin:', origin);
  } 
  else {
    // Don't set wildcard in production
    if (process.env.VERCEL_ENV === 'production') {
      // In production, only allow specific origins
      if (origin) {
        console.warn('⚠️ Rejected CORS origin:', origin);
      }
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
}

export function handleCors(req, res) {
  setCorsHeaders(req, res);
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('🔄 Handling OPTIONS preflight for:', req.url);
    res.status(204).end();
    return true;
  }
  
  return false;
}