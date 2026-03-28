// simple-proxy.js - Simplified version
import http from 'http';
import httpProxy from 'http-proxy';

const proxy = httpProxy.createProxyServer({
  target: 'https://mindmate.vercel.app',
  changeOrigin: true
});

const server = http.createServer((req, res) => {
  const origin = req.headers.origin;
  
  // Set CORS headers
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('🔄 Handling OPTIONS preflight');
    res.writeHead(204);
    res.end();
    return;
  }
  
  console.log(`📤 ${req.method} ${req.url}`);
  
  // Proxy the request
  proxy.web(req, res, {}, (err) => {
    console.error('❌ Proxy error:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Proxy error', 
      message: err.message 
    }));
  });
});

// Handle proxy errors
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  if (!res.headersSent) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log('\n========================================');
  console.log(`🚀 Simple proxy running at http://localhost:${PORT}`);
  console.log(`📡 Proxying to https://mindmate.vercel.app`);
  console.log(`\n✅ Ready to accept requests from:`);
  console.log(`   - http://127.0.0.1:5500`);
  console.log(`   - http://localhost:5500`);
  console.log('\n📝 Test with:');
  console.log(`   curl http://localhost:${PORT}/health`);
  console.log('========================================\n');
});