// api/test.js
export default async function handler(req, res) {
  const allowedOrigins = [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://mindmate.vercel.app'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  return res.status(200).json({ 
    message: "CORS is configured correctly!",
    timestamp: new Date().toISOString()
  });
}