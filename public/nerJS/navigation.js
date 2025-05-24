import { state } from './state.js';
import { updateSentence } from './sentence.js';

window.showPrev = function() {
  state.currentIndex = (state.currentIndex - 1 + state.sentences.length) % state.sentences.length;
  updateSentence();
};

window.showNext = function() {
  state.currentIndex = (state.currentIndex + 1) % state.sentences.length;
  updateSentence();
};
