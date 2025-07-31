// self-check.js
// ✅ Enhanced emotional self-check with AI-powered insights

document.addEventListener("DOMContentLoaded", () => {
  const quizForm = document.getElementById("self-check-form");
  const resultBox = document.getElementById("result");
  const resetBtn = document.getElementById("reset-check");

  if (!quizForm || !resultBox) return;

  quizForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // ✅ Collect answers
    const mood = quizForm.querySelector('select[name="mood"]').value;
    const sleep = quizForm.querySelector('input[name="sleep"]:checked')?.value;
    const support = quizForm.querySelector('input[name="support"]:checked')?.value;
    const focus = quizForm.querySelector('input[name="focus"]:checked')?.value;

    // Show loading state
    resultBox.textContent = "🧠 Analyzing your responses...";
    resultBox.classList.remove("hidden");

    try {
      // Create a comprehensive analysis prompt
      const analysisPrompt = `Analyze this emotional self-check data and provide a helpful, supportive response:
        - Current mood: ${mood}
        - Sleeping well: ${sleep}
        - Feeling supported: ${support}
        - Difficulty focusing: ${focus}
        
        Provide a brief, empathetic analysis with specific suggestions. Keep it under 150 words.`;

      // Use a simple AI API for analysis (fallback to local logic if API fails)
      let aiResponse = null;
      
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer sk-proj-..." // You'll need to add your API key here
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "You are a supportive mental health assistant. Provide brief, empathetic responses with practical suggestions."
              },
              {
                role: "user",
                content: analysisPrompt
              }
            ],
            max_tokens: 200,
            temperature: 0.7
          })
        });

        if (response.ok) {
          const data = await response.json();
          aiResponse = data.choices[0].message.content;
        }
      } catch (apiError) {
        console.log("AI API not available, using local analysis");
      }

      // Generate enhanced local analysis if AI API is not available
      if (!aiResponse) {
        aiResponse = generateLocalAnalysis(mood, sleep, support, focus);
      }

      // Display the result
      resultBox.innerHTML = `
        <div class="analysis-result">
          <h3>📊 Your Emotional Check-In</h3>
          <p>${aiResponse}</p>
          <div class="quick-tips">
            <h4>💡 Quick Tips:</h4>
            <ul>
              ${generateQuickTips(mood, sleep, support, focus)}
            </ul>
          </div>
        </div>
      `;
      
      resetBtn.style.display = "inline-block";
    } catch (error) {
      console.error("Analysis error:", error);
      resultBox.textContent = "❌ Analysis failed. Please try again.";
    }
  });

  // ✅ Reset quiz
  resetBtn.addEventListener("click", () => {
    quizForm.reset();
    resultBox.textContent = "";
    resultBox.classList.add("hidden");
    resetBtn.style.display = "none";
  });

  // Helper function for local analysis
  function generateLocalAnalysis(mood, sleep, support, focus) {
    let analysis = "";
    
    // Mood-based analysis
    if (mood === "stressed" || mood === "anxious") {
      analysis += "You're experiencing some stress and anxiety. This is completely normal, and there are ways to manage it. ";
    } else if (mood === "down") {
      analysis += "You're feeling low right now. Remember that difficult emotions are temporary and it's okay to not be okay. ";
    } else if (mood === "good") {
      analysis += "It's wonderful that you're feeling good! This positive energy can help you throughout your day. ";
    } else {
      analysis += "Your mood seems balanced. This is a good foundation for emotional well-being. ";
    }

    // Sleep analysis
    if (sleep === "no") {
      analysis += "Poor sleep can significantly impact your mood and daily functioning. Consider establishing a bedtime routine. ";
    } else {
      analysis += "Good sleep is essential for emotional regulation, and it sounds like you're taking care of this. ";
    }

    // Support analysis
    if (support === "no") {
      analysis += "Feeling unsupported can be challenging. Consider reaching out to friends, family, or a mental health professional. ";
    } else {
      analysis += "Having emotional support is a great protective factor for mental health. ";
    }

    // Focus analysis
    if (focus === "yes") {
      analysis += "Difficulty focusing can be a sign of stress or overwhelm. Try breaking tasks into smaller steps. ";
    }

    return analysis;
  }

  // Helper function for quick tips
  function generateQuickTips(mood, sleep, support, focus) {
    const tips = [];
    
    if (mood === "stressed" || mood === "anxious") {
      tips.push("<li>Try deep breathing exercises</li>");
      tips.push("<li>Take a 5-minute break</li>");
    }
    
    if (sleep === "no") {
      tips.push("<li>Limit screen time before bed</li>");
      tips.push("<li>Create a relaxing bedtime routine</li>");
    }
    
    if (support === "no") {
      tips.push("<li>Reach out to a trusted friend</li>");
      tips.push("<li>Consider talking to a counselor</li>");
    }
    
    if (focus === "yes") {
      tips.push("<li>Try the Pomodoro technique</li>");
      tips.push("<li>Minimize distractions</li>");
    }
    
    // Default tips
    if (tips.length === 0) {
      tips.push("<li>Practice gratitude daily</li>");
      tips.push("<li>Stay hydrated and eat well</li>");
    }
    
    return tips.join("");
  }
});
