// Shared defaults for GeminiShortcut
// Single source of truth — imported by popup.js, background.js, and content.js

export const DEFAULT_PROMPTS = {
  summarize: { name: "Summarize (3 bullets)", text: "Provide a concise 3-bullet summary of this: " },
  explain:   { name: "Explain Simply (ELI5)", text: "Explain this in simple terms for a student: " },
  notes:     { name: "Make Study Notes",      text: "Turn this into clean study notes with headings and bullet points: " },
  quiz:       { name: "Quiz Me",               text: "Create 5 quiz questions (with answers) based on this: " },
  rewrite:   { name: "Rewrite Clearly",       text: "Rewrite this to be clear and well-structured for studying: " }
};

export const DEFAULT_SETTINGS = {
  floatingEnabled:  true,
  floatingActionId: "summarize"
};
