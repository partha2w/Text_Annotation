import { state } from './state.js';
import { updateSentence } from './sentence.js';

export function setupUploadHandler() {
  document.getElementById("upload-form").addEventListener('submit', function(e) {
    e.preventDefault();
    const fileInput = document.getElementById("textFile").files[0];
    const formData = new FormData();
    formData.append('textFile', fileInput);

    const reader = new FileReader();
    reader.readAsText(fileInput);

    reader.onload = function () {
      state.originalText = reader.result;
    };

    fetch('/upload', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      state.sentences = data.text.split(/(?<=[।!?])/).filter(sentence => sentence.trim() !== '');
      state.currentIndex = 0;
      state.annotations = [];
      updateSentence();
    })
    .catch(error => console.error('Error: ', error));
  });
}
