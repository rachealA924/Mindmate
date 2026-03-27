// api/analyze/mood.js
// POST /api/analyze/mood  — server-side sentiment analysis with richer NLP

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ error: "text field is required." });
    }

    const result = analyzeSentiment(text.trim());

    return res.status(200).json(result);
  } catch (err) {
    console.error("Mood analysis error:", err);
    return res.status(500).json({ error: "Analysis failed." });
  }
}

// ─── Enhanced sentiment engine ────────────────────────────────────────────────
function analyzeSentiment(text) {
  const POSITIVE = {
    happy: 2, joy: 2, great: 2, wonderful: 2, amazing: 2, love: 2, excellent: 2,
    grateful: 2, blessed: 2, peaceful: 2, calm: 1, relaxed: 1, content: 1,
    fulfilled: 2, inspired: 1, motivated: 2, energetic: 1, optimistic: 2,
    hopeful: 2, good: 1, better: 1, excited: 2, proud: 1, confident: 1,
    supported: 1, strong: 1, thankful: 2, glad: 1, cheerful: 2,
  };

  const NEGATIVE = {
    sad: 2, depressed: 3, anxious: 2, stressed: 2, angry: 2, terrible: 2,
    awful: 2, hate: 2, worried: 2, frustrated: 2, disappointed: 2, lonely: 3,
    tired: 1, exhausted: 2, overwhelmed: 2, hopeless: 3, helpless: 3,
    fearful: 2, scared: 2, bad: 1, worse: 2, miserable: 3, empty: 2,
    numb: 2, lost: 2, broken: 3, hurt: 2, pain: 2, suffering: 3,
    worthless: 3, useless: 2, trapped: 2,
  };

  const INTENSIFIERS = new Set(["very", "really", "so", "extremely", "absolutely", "truly"]);
  const NEGATORS = new Set(["not", "never", "no", "don't", "didn't", "doesn't", "can't", "won't", "isn't", "aren't"]);

  const words = text.toLowerCase().replace(/[^a-z\s']/g, "").split(/\s+/).filter(Boolean);

  let score = 0;
  let totalWeight = 0;
  const foundKeywords = [];
  let negated = false;
  let intensify = false;

  words.forEach((word, i) => {
    if (NEGATORS.has(word)) { negated = true; return; }
    if (INTENSIFIERS.has(word)) { intensify = true; return; }

    const posWeight = POSITIVE[word];
    const negWeight = NEGATIVE[word];

    if (posWeight !== undefined) {
      const w = intensify ? posWeight * 1.5 : posWeight;
      score += negated ? -w : w;
      totalWeight += w;
      foundKeywords.push({ word, sentiment: negated ? "negative" : "positive" });
    } else if (negWeight !== undefined) {
      const w = intensify ? negWeight * 1.5 : negWeight;
      score += negated ? w : -w;
      totalWeight += w;
      foundKeywords.push({ word, sentiment: negated ? "positive" : "negative" });
    }

    // Reset modifiers after a sentiment word, or after 2 words
    if (posWeight !== undefined || negWeight !== undefined || i % 3 === 0) {
      negated = false;
      intensify = false;
    }
  });

  // Normalise to -1..1
  const rawScore = totalWeight > 0 ? score / (totalWeight * 1.5) : 0;
  const normalizedScore = Math.max(-1, Math.min(1, rawScore));

  // Determine label
  let label, emoji, advice;
  if (normalizedScore >= 0.4) {
    label = "Very positive";
    emoji = "😊";
    advice = "You're in a great emotional space. Keep nurturing what's working for you!";
  } else if (normalizedScore >= 0.1) {
    label = "Positive";
    emoji = "🙂";
    advice = "Things seem to be going okay. Keep checking in with yourself.";
  } else if (normalizedScore > -0.1) {
    label = "Neutral";
    emoji = "😐";
    advice = "Your mood seems balanced. Regular self-check-ins can help you stay grounded.";
  } else if (normalizedScore > -0.4) {
    label = "Negative";
    emoji = "😔";
    advice = "It sounds like you're going through something tough. Consider reaching out to someone you trust.";
  } else {
    label = "Very negative";
    emoji = "😞";
    advice = "You seem to be in a really difficult place. Please consider speaking with a mental health professional — you deserve support.";
  }

  return {
    score: parseFloat(normalizedScore.toFixed(3)),
    label,
    emoji,
    advice,
    keywords: foundKeywords.slice(0, 6).map((k) => k.word),
    wordCount: words.length,
  };
}