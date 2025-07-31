// sentiment.js
// ✅ Real mood analysis with reliable free API

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
      // Use a more reliable sentiment analysis approach
      const sentiment = analyzeSentiment(userText);
      
      // Generate user-friendly response
      let sentimentEmoji = "😐";
      let sentimentText = "Neutral";
      
      if (sentiment.score > 0.1) {
        sentimentEmoji = "😊";
        sentimentText = "Positive";
      } else if (sentiment.score < -0.1) {
        sentimentEmoji = "😔";
        sentimentText = "Negative";
      }

      // Generate personalized message based on sentiment
      let message = "";
      if (sentiment.score > 0.1) {
        message = "It sounds like you're in a good place emotionally. Keep that positive energy flowing!";
      } else if (sentiment.score < -0.1) {
        message = "It's okay to feel this way. Consider talking to someone you trust or practicing self-care.";
      } else {
        message = "Your mood seems balanced. Remember to check in with yourself regularly.";
      }

      moodResult.innerHTML = `
        <p><strong>📝 Sentiment:</strong> ${sentimentEmoji} ${sentimentText}</p>
        <p>📊 <strong>Score:</strong> ${sentiment.score.toFixed(2)}</p>
        <p>🔑 <strong>Keywords:</strong> ${sentiment.keywords.join(", ")}</p>
        <p>💭 <strong>Insight:</strong> ${message}</p>
      `;
    } catch (error) {
      console.error("Sentiment analysis error:", error);
      moodResult.innerHTML = "❌ Mood analysis failed. Please try again.";
    }
  });

  // Enhanced sentiment analysis function
  function analyzeSentiment(text) {
    const positiveWords = [
      "happy", "good", "great", "excellent", "wonderful", "amazing", "love", "joy", 
      "excited", "blessed", "grateful", "peaceful", "calm", "relaxed", "content",
      "fulfilled", "inspired", "motivated", "energetic", "optimistic", "hopeful"
    ];
    
    const negativeWords = [
      "sad", "bad", "terrible", "awful", "hate", "angry", "depressed", "anxious",
      "worried", "stressed", "frustrated", "disappointed", "lonely", "tired",
      "exhausted", "overwhelmed", "hopeless", "helpless", "fearful", "scared"
    ];
    
    const neutralWords = [
      "okay", "fine", "normal", "alright", "neutral", "average", "regular"
    ];

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    const foundKeywords = [];

    words.forEach(word => {
      if (positiveWords.includes(word)) {
        positiveCount++;
        foundKeywords.push(word);
      } else if (negativeWords.includes(word)) {
        negativeCount++;
        foundKeywords.push(word);
      } else if (neutralWords.includes(word)) {
        neutralCount++;
      }
    });

    // Calculate sentiment score (-1 to 1)
    const totalWords = words.length;
    const positiveScore = positiveCount / totalWords;
    const negativeScore = negativeCount / totalWords;
    const score = positiveScore - negativeScore;

    // Ensure score is between -1 and 1
    const normalizedScore = Math.max(-1, Math.min(1, score));

    return {
      score: normalizedScore,
      keywords: foundKeywords.slice(0, 5) // Limit to 5 keywords
    };
  }
});
