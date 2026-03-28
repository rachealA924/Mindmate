const usageStore = new Map(); 

export async function checkRateLimit(userId, limit = 2) {
  if (!userId) return { allowed: true }; // Allow anonymous users but track
  
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000; // 1 hour window
  
  let userUsage = usageStore.get(userId) || [];
  
  // Clean up old entries
  userUsage = userUsage.filter(timestamp => timestamp > hourAgo);
  
  if (userUsage.length >= limit) {
    return { 
      allowed: false, 
      remaining: 0,
      resetTime: new Date(userUsage[0] + 3600000).toISOString()
    };
  }
  
  userUsage.push(now);
  usageStore.set(userId, userUsage);
  
  return {
    allowed: true,
    remaining: limit - userUsage.length,
    totalUsed: userUsage.length
  };
}

// Optional: Store in Firestore for persistence across serverless functions
export async function checkRateLimitFirestore(userId, db, limit = 2) {
  if (!userId) return { allowed: true };
  
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const usageSnapshot = await db.collection("usage_limits")
    .where("userId", "==", userId)
    .where("timestamp", ">", hourAgo)
    .count()
    .get();
  
  const currentCount = usageSnapshot.data().count;
  
  if (currentCount >= limit) {
    return { allowed: false, remaining: 0 };
  }
  
  return { allowed: true, remaining: limit - currentCount };
}

export async function recordUsage(userId, db, type = "mood_analysis") {
  if (!userId) return;
  
  await db.collection("usage_limits").add({
    userId,
    type,
    timestamp: new Date(),
    ip: null // Would be available from request
  });
}