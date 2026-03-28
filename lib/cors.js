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
    console.log('Request headers:', req.headers);

    // 1. Handle Access-Control-Allow-Origin
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        console.log('✅ Allowed origin from whitelist:', origin);
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
            console.log('⚠️ Using wildcard CORS for non-production');
        } else if (origin) {
            console.warn('⚠️ Rejected CORS origin in production:', origin);
        }
    }

    // 2. Standard CORS Headers - ENSURE Authorization is included
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    
    // CRITICAL FIX: Ensure Authorization is explicitly listed
    // The order and exact string matter for some browsers
    const allowedHeaders = [
        'Content-Type',
        'Authorization',      // This is crucial for your auth middleware
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-HTTP-Method-Override'
    ].join(', ');
    
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders);
    
    // Expose headers that the frontend might need to read
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, X-Requested-With, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    
    console.log('✅ CORS headers set:', {
        'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': res.getHeader('Access-Control-Allow-Headers')
    });
}

export function handleCors(req, res) {
    const origin = req.headers.origin;

    // 3. Robust Preflight handling
    // Explicitly setting status 204 and Content-Length 0 for OPTIONS requests
    if (req.method === 'OPTIONS') {
        console.log('🔄 Handling OPTIONS preflight for:', req.url);
        
        // Set all CORS headers for preflight
        setCorsHeaders(req, res);
        
        // Ensure preflight response is properly formatted
        res.statusCode = 204;
        res.setHeader('Content-Length', '0');
        res.end();
        return true;
    }

    return false;
}

// Helper function to wrap API handlers with CORS
export function withCors(handler) {
    return async (req, res) => {
        // Set CORS headers for all requests
        setCorsHeaders(req, res);
        
        // Handle preflight
        if (handleCors(req, res)) {
            return; // Preflight handled, don't proceed to handler
        }
        
        // Pass through to actual handler
        return handler(req, res);
    };
}