// sentiment.js - Updated with premium prompts
const API_BASE = window.location.origin;

document.addEventListener("DOMContentLoaded", () => {
  const moodForm = document.getElementById("mood-form");
  const moodInput = document.getElementById("mood-input");
  const moodResult = document.getElementById("mood-result");

  if (!moodForm || !moodInput || !moodResult) return;

  moodForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const userText = moodInput.value.trim();

    if (!userText) {
      moodResult.textContent = "⚠️ Please write something first.";
      return;
    }

    moodResult.textContent = "🧠 Analyzing your mood...";
    
    const idToken = localStorage.getItem("mindmate_id_token");

    try {
      const res = await fetch(`${API_BASE}/api/analyze/mood`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(idToken && { Authorization: `Bearer ${idToken}` })
        },
        body: JSON.stringify({ text: userText }),
      });

      const data = await res.json();
      
      if (res.status === 429) {
        // Rate limit reached - show premium upgrade prompt
        moodResult.innerHTML = `
          <div class="rate-limit-prompt">
            <p>🚫 <strong>${data.message}</strong></p>
            <div class="premium-offer">
              <h3>✨ Upgrade to Premium ✨</h3>
              <p>Get unlimited mood analysis, priority appointments, and personalized insights!</p>
              <ul>
                <li>✓ Unlimited mood analysis</li>
                <li>✓ Priority booking with top therapists</li>
                <li>✓ Personalized mental health insights</li>
                <li>✓ Downloadable resources</li>
              </ul>
              <button id="upgrade-premium-btn" class="btn-premium">Upgrade Now - $9.99/month</button>
              <button id="dismiss-limit-btn" class="btn-secondary">Remind me later</button>
            </div>
          </div>
        `;
        
        document.getElementById("upgrade-premium-btn")?.addEventListener("click", () => {
          // Redirect to premium signup page
          window.location.href = "premium.html";
        });
        
        document.getElementById("dismiss-limit-btn")?.addEventListener("click", () => {
          moodResult.innerHTML = "<p>You've reached the free limit. Upgrade to premium for unlimited analyses.</p>";
        });
        
        return;
      }
      
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      const remainingText = data.isPremium 
        ? "✨ Premium user - unlimited access ✨"
        : `📊 Free uses remaining: ${data.usageRemaining}/2`;
      
      moodResult.innerHTML = `
        <p><strong>📝 Sentiment:</strong> ${data.emoji} ${data.label}</p>
        <p>📊 <strong>Score:</strong> ${data.score}</p>
        <p>🔑 <strong>Keywords:</strong> ${data.keywords.join(", ") || "none detected"}</p>
        <p>💭 <strong>Insight:</strong> ${data.advice}</p>
        <p class="usage-info">${remainingText}</p>
        ${!data.isPremium && data.usageRemaining === 1 ? '<p class="warning">⚠️ You have 1 free analysis remaining. Consider upgrading to Premium!</p>' : ''}
      `;
    } catch (err) {
      console.error("Sentiment error:", err);
      moodResult.innerHTML = "❌ Mood analysis failed. Please try again.";
    }
  });
});