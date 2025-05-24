import "./navigation.js";
import { setupUploadHandler } from './upload.js';
import { setupTagging } from './annotations.js';
import { setupSaveAnnotations, setupDownload, setupAnalyzeText } from './actions.js';
import { updateSentence } from './sentence.js';


document.addEventListener('DOMContentLoaded', () => {
  setupUploadHandler();
  setupTagging();
  setupSaveAnnotations();
  setupDownload();
  setupAnalyzeText();
  updateSentence();
});
