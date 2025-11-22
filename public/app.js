const messagesContainer = document.getElementById("chat-messages");
const form = document.getElementById("message-form");
const input = document.getElementById("user-input");

/**
 * Format Migo's text:
 * - Escape HTML
 * - Convert **bold** to <strong>
 * - Convert newlines to <br>
 */
function formatMigoText(text) {
  if (!text) return "";

  // Escape HTML
  let safe = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold: **something**
  safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Newlines → <br>
  safe = safe.replace(/\n/g, "<br>");

  return safe;
}

// Helper: create a message bubble
function addMessage(text, sender = "migo", options = {}) {
  const { isTyping = false } = options;

  const row = document.createElement("div");
  row.className = `message-row ${sender}`;

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  if (isTyping) {
    const typing = document.createElement("div");
    typing.className = "typing-indicator";
    typing.innerHTML =
      '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    bubble.appendChild(typing);
  } else {
    if (sender === "migo") {
      bubble.innerHTML = formatMigoText(text);
    } else {
      bubble.textContent = text;
    }
  }

  row.appendChild(bubble);
  messagesContainer.appendChild(row);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  return row;
}

// Intro from Migo with a typing effect
function showMigoIntro() {
  const intro =
    "Hey, I’m Migo 👋\n\n" +
    "I can help you plan:\n" +
    "• Budget-friendly 1-day trips\n" +
    "• Weather-aware travel plans\n" +
    "• Places to visit around any city\n\n" +
    "Try asking me something like:\n" +
    "“Plan a 1 day peaceful trip to Bangalore under 1500 and tell me the weather.”";

  // Show typing dots first
  const typingRow = addMessage("", "migo", { isTyping: true });

  setTimeout(() => {
    typingRow.remove();
    addMessage(intro, "migo");
  }, 600);
}

// Handle form submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  // Show user message
  addMessage(text, "user");
  input.value = "";

  // Show typing indicator
  const typingRow = addMessage("", "migo", { isTyping: true });

  try {
    const res = await fetch("/api/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: text }),
    });

    const data = await res.json();

    // Remove typing indicator
    typingRow.remove();

    if (!res.ok || data.error) {
      const errText =
        data.error ||
        "I ran into a problem while thinking about your trip. Please try again in a moment.";
      addMessage(`⚠️ ${errText}`, "migo");
      return;
    }

    // Show Migo's answer with markdown formatting
    addMessage(data.answer, "migo");
  } catch (err) {
    typingRow.remove();
    addMessage(
      "⚠️ I’m having trouble talking to my backend right now. Please check if the server is running.",
      "migo"
    );
    console.error(err);
  }
});

// Run intro on page load
showMigoIntro();

// -----------------------------
// SUGGESTION BUTTON HANDLING
// -----------------------------

const suggestionSection = document.getElementById("suggested-prompts");
const suggestionButtons = document.querySelectorAll(".suggestion-pill");

// Show suggestions AFTER intro renders (if section exists)
if (suggestionSection) {
  setTimeout(() => {
    suggestionSection.classList.remove("hidden");
  }, 300);
}

// Auto-fill + auto-send when a suggestion is clicked
suggestionButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const text = btn.getAttribute("data-prompt");
    if (!text) return;

    input.value = text;
    form.dispatchEvent(new Event("submit")); // Auto-send
  });
});
