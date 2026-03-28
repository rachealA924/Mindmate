// lib/rate-limit.js
import { db } from './firebase-admin.js';

// In-memory fallback for when Firestore is not available
const memoryStore = new Map();

export async function checkRateLimit(userId, limit = 2, timeWindow = 3600000) {
  if (!userId) return { allowed: true, remaining: limit };
  
  try {
    // Try to use Firestore first (persistent across serverless functions)
    return await checkRateLimitFirestore(userId, limit, timeWindow);
  } catch (error) {
    console.warn('Firestore rate limit check failed, using memory store:', error.message);
    // Fallback to memory store
    return checkRateLimitMemory(userId, limit, timeWindow);
  }
}

async function checkRateLimitFirestore(userId, limit = 2, timeWindow = 3600000) {
  const timeAgo = new Date(Date.now() - timeWindow);
  
  // Get count of usages in the last hour
  const usageSnapshot = await db.collection('usage_limits')
    .where('userId', '==', userId)
    .where('timestamp', '>', timeAgo)
    .get();
  
  const currentCount = usageSnapshot.size;
  
  if (currentCount >= limit) {
    const oldestUsage = usageSnapshot.docs[0]?.data().timestamp;
    const resetTime = new Date(oldestUsage.getTime() + timeWindow);
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: resetTime.toISOString(),
      totalUsed: currentCount
    };
  }
  
  return {
    allowed: true,
    remaining: limit - currentCount,
    totalUsed: currentCount
  };
}

function checkRateLimitMemory(userId, limit = 2, timeWindow = 3600000) {
  const now = Date.now();
  const timeAgo = now - timeWindow;
  
  let userUsage = memoryStore.get(userId) || [];
  
  // Clean up old entries
  userUsage = userUsage.filter(timestamp => timestamp > timeAgo);
  
  if (userUsage.length >= limit) {
    const resetTime = new Date(userUsage[0] + timeWindow);
    return {
      allowed: false,
      remaining: 0,
      resetTime: resetTime.toISOString(),
      totalUsed: userUsage.length
    };
  }
  
  userUsage.push(now);
  memoryStore.set(userId, userUsage);
  
  // Clean up memory store periodically (every hour)
  if (memoryStore.size > 1000) {
    setTimeout(() => cleanMemoryStore(timeWindow), 60000);
  }
  
  return {
    allowed: true,
    remaining: limit - userUsage.length,
    totalUsed: userUsage.length
  };
}

export async function recordUsage(userId, type = 'mood_analysis', metadata = {}) {
  if (!userId) return;
  
  try {
    await db.collection('usage_limits').add({
      userId,
      type,
      timestamp: new Date(),
      metadata,
      createdAt: new Date().toISOString()
    });
    
    // Also record in memory for faster checks
    const now = Date.now();
    const userUsage = memoryStore.get(userId) || [];
    userUsage.push(now);
    memoryStore.set(userId, userUsage);
    
  } catch (error) {
    console.error('Failed to record usage:', error.message);
    // Still record in memory even if Firestore fails
    const now = Date.now();
    const userUsage = memoryStore.get(userId) || [];
    userUsage.push(now);
    memoryStore.set(userId, userUsage);
  }
}

function cleanMemoryStore(timeWindow) {
  const now = Date.now();
  const timeAgo = now - timeWindow;
  
  for (const [userId, timestamps] of memoryStore.entries()) {
    const filtered = timestamps.filter(ts => ts > timeAgo);
    if (filtered.length === 0) {
      memoryStore.delete(userId);
    } else {
      memoryStore.set(userId, filtered);
    }
  }
}

// Helper to get user's remaining quota
export async function getRemainingQuota(userId, limit = 2) {
  if (!userId) return { remaining: limit, isPremium: false };
  
  try {
    // Check if user is premium
    const userDoc = await db.collection('users').doc(userId).get();
    const isPremium = userDoc.exists && userDoc.data().premium === true;
    
    if (isPremium) {
      return { remaining: Infinity, isPremium: true };
    }
    
    const { remaining, totalUsed } = await checkRateLimit(userId, limit);
    return { remaining, totalUsed, isPremium: false };
    
  } catch (error) {
    console.error('Failed to get quota:', error.message);
    return { remaining: limit, isPremium: false };
  }
}