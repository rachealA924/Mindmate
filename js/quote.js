// quote-rotator.js
// ✅ Enhanced quote system with multiple categories and better features

document.addEventListener("DOMContentLoaded", () => {
  const quoteBox = document.getElementById("quote-box");
  if (!quoteBox) return;

  // Quote categories with fallback quotes
  const quoteCategories = {
    motivation: {
      api: "https://zenquotes.io/api/random",
      fallbacks: [
        { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
        { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" }
      ]
    },
    mentalHealth: {
      api: "https://zenquotes.io/api/random",
      fallbacks: [
        { quote: "It's okay to not be okay. It's okay to ask for help.", author: "Unknown" },
        { quote: "Your mental health is a priority. Your happiness is essential. Your self-care is a necessity.", author: "Unknown" },
        { quote: "Healing is not linear. It's okay to have bad days.", author: "Unknown" }
      ]
    },
    stressRelief: {
      api: "https://zenquotes.io/api/random", 
      fallbacks: [
        { quote: "Peace comes from within. Do not seek it without.", author: "Buddha" },
        { quote: "Take life day by day and be grateful for the little things.", author: "Unknown" },
        { quote: "In the midst of movement and chaos, keep stillness inside of you.", author: "Deepak Chopra" }
      ]
    }
  };

  let currentCategory = 'motivation';

  function renderQuote(quote, author, category = currentCategory) {
    const categoryNames = {
      motivation: "Motivation",
      mentalHealth: "Mental Health", 
      stressRelief: "Stress Relief"
    };

    quoteBox.innerHTML = `
      <div class="quote-category">
        <span class="category-badge">${categoryNames[category]}</span>
      </div>
      <blockquote>"${quote}"</blockquote>
      <cite>– ${author}</cite>
      <div class="quote-actions">
        <button id="new-quote">🔁 New Quote</button>
        <button id="share-quote">📤 Share</button>
        <button id="category-toggle">📚 Categories</button>
      </div>
      <div id="category-menu" class="category-menu hidden">
        <button class="category-btn" data-category="motivation">💪 Motivation</button>
        <button class="category-btn" data-category="mentalHealth">🧠 Mental Health</button>
        <button class="category-btn" data-category="stressRelief">😌 Stress Relief</button>
      </div>
    `;

    // Add event listeners
    document.getElementById("new-quote").addEventListener("click", fetchQuote);
    document.getElementById("share-quote").addEventListener("click", shareQuote);
    document.getElementById("category-toggle").addEventListener("click", toggleCategories);
    
    // Add category button listeners
    document.querySelectorAll(".category-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        currentCategory = e.target.dataset.category;
        toggleCategories();
        fetchQuote();
      });
    });
  }

  function fetchQuote() {
    quoteBox.innerHTML = "<p>Loading...</p>";
    
    const category = quoteCategories[currentCategory];
    
    fetch("https://api.allorigins.win/get?url=" + encodeURIComponent(category.api))
      .then((res) => res.json())
      .then((data) => {
        try {
          const parsedData = JSON.parse(data.contents);
          if (parsedData && parsedData[0]) {
            renderQuote(parsedData[0].q, parsedData[0].a, currentCategory);
          } else {
            throw new Error("No quote data");
          }
        } catch (error) {
          // Use fallback quotes if API fails
          const fallback = category.fallbacks[Math.floor(Math.random() * category.fallbacks.length)];
          renderQuote(fallback.quote, fallback.author, currentCategory);
        }
      })
      .catch(() => {
        // Use fallback quotes if network fails
        const fallback = category.fallbacks[Math.floor(Math.random() * category.fallbacks.length)];
        renderQuote(fallback.quote, fallback.author, currentCategory);
      });
  }

  function shareQuote() {
    const quoteElement = quoteBox.querySelector("blockquote");
    const authorElement = quoteBox.querySelector("cite");
    
    if (quoteElement && authorElement) {
      const quote = quoteElement.textContent;
      const author = authorElement.textContent;
      const shareText = `${quote} ${author}`;
      
      if (navigator.share) {
        navigator.share({
          title: 'MindMate Quote',
          text: shareText,
          url: window.location.href
        });
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
          alert("Quote copied to clipboard!");
        }).catch(() => {
          // Final fallback: show the text
          prompt("Copy this quote:", shareText);
        });
      }
    }
  }

  function toggleCategories() {
    const menu = document.getElementById("category-menu");
    if (menu) {
      menu.classList.toggle("hidden");
    }
  }

  // Load first quote immediately
  fetchQuote();
});
