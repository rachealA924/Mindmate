// sentiment.js  (UPDATED — replaces the old version)
// Sends text to backend for server-side mood analysis

const API_BASE = "https://mindmate.vercel.app/api";

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

    try {
      const res = await fetch(`${API_BASE}/analyze/mood`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      moodResult.innerHTML = `
        <p><strong>📝 Sentiment:</strong> ${data.emoji} ${data.label}</p>
        <p>📊 <strong>Score:</strong> ${data.score}</p>
        <p>🔑 <strong>Keywords:</strong> ${data.keywords.join(", ") || "none detected"}</p>
        <p>💭 <strong>Insight:</strong> ${data.advice}</p>
      `;
    } catch (err) {
      console.error("Sentiment error:", err);
      moodResult.innerHTML = "❌ Mood analysis failed. Please try again.";
    }
  });
});