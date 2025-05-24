import { state } from './state.js';

export function updateSentence() {
    const sentenceDisplay = document.getElementById('editable-div');
    if (!state.sentences.length) {
      sentenceDisplay.innerHTML = "No sentences loaded.";
      document.getElementById('totalSentences').textContent = "";
      return;
    }
    let currentSentence = state.sentences[state.currentIndex];
    let annotatedSentence = currentSentence;
  
    state.annotations.forEach(({ text, label, color }) => {
      const taggedText = `<span style="background-color: ${color};">${text} (${label})</span>`;
      const regex = new RegExp(`(?<!>)${text}(?!<)`, "g");
      annotatedSentence = annotatedSentence.replace(regex, taggedText);
    });
  
    sentenceDisplay.innerHTML = annotatedSentence;
    document.getElementById('totalSentences').textContent =
      `Sentence ${state.currentIndex + 1} of ${state.sentences.length}`;
  }
  