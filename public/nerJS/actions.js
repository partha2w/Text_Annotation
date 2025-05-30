// actions.js
import { state } from './state.js';
import { updateSentence } from './sentence.js';
import { showAnnotations } from './ui.js';

export function setupSaveAnnotations() {
  document.getElementById("save-annotations-btn").addEventListener("click", () => {
    const tagFormat = document.getElementById("tag_format").value;
    if (tagFormat == 0) {
      alert("Please choose an annotation Tagging Scheme to Save First!");
    } else {
      const annotatedParagraph = state.sentences.map(sentence => {
        let annotatedSentence = sentence;
        state.annotations.forEach(({ text, label }) => {
          if (sentence.includes(text)) {
            const taggedText = `${text} (${label})`;
            annotatedSentence = annotatedSentence.replaceAll(text, taggedText);
          }
        });
        return annotatedSentence;
      }).join(" ");
      fetch('/annotation/save-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annotations: state.annotations, tagFormat, text: annotatedParagraph })
      })
        .then(response => {
          if (!response.ok) throw new Error('Network response was not ok');
          return response.json();
        })
        .then(data => {
          showAnnotations(data.annotations);
          alert("Saved, Now you can Download");
        })
        .catch(error => console.error('Error saving annotations:', error));
    }
  });
}

export function setupDownload() {
  document.getElementById("download-btn").addEventListener("click", function () {
    fetch('/annotation/download')
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        const contentDisposition = response.headers.get('Content-Disposition');
        const fileName = contentDisposition
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : 'default_filename.txt';
        return response.blob().then(blob => ({ blob, fileName }));
      })
      .then(({ blob, fileName }) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        alert("Annotated file downloaded successfully!");
      })
      .catch(error => console.error('Error:', error));
  });
}

export function setupAnalyzeText() {
  document.getElementById("analyze-btn").addEventListener("click", async () => {
    if (state.originalText == "") {
      alert("Please upload a text file first!");
      return;
    }
    const spinner = document.getElementById("loading-spinner");
    spinner.style.display = "inline-block"; // Show spinner
    const button = document.getElementById("analyze-btn");
    button.disabled = true;
    button.style.opacity = 0.5;

    // Get selected model
    const modelName = document.getElementById("model-select").value;

    try {
      const response = await fetch("/ner/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          originalText: state.originalText,
          model: modelName // Send selected model
        })
      });
      const data = await response.json();
      state.annotations.length = 0;
      data.newAnnotations.forEach(a => state.annotations.push(a));
      updateSentence();
    } catch (error) {
      alert("Error fetching entities from Model:", error);
      console.error("Error:", error);
    } finally {
      spinner.style.display = "none"; // Hide spinner after fetch completes
      button.disabled = false;
      button.style.opacity = 1;
    }
  });
}
