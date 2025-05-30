import { state } from './state.js';
import { updateSentence } from './sentence.js';

export function setupTagging() {
  document.getElementById("addTag").addEventListener('click', function() {
    let tagName = document.getElementById("tag-name").value.toUpperCase();
    if (tagName !== "") {
      const newButton = document.createElement("button");
      newButton.innerHTML = tagName;
      newButton.style.backgroundColor = state.colors[state.colorIndex];
      newButton.classList.add("tag-button");
      state.colorIndex = (state.colorIndex + 1) % state.colors.length;

      let color = newButton.style.backgroundColor;
      newButton.addEventListener('click', function() {
        if (state.selectedWord !== "") {
          const paragraphElement = document.getElementById("editable-div");
          const paragraph = paragraphElement.innerHTML;
          const taggedText = `<span style="background-color: ${color};">${state.selectedWord} (${tagName})</span>`;
          paragraphElement.innerHTML = paragraph.replaceAll(state.selectedWord, taggedText);

          const startIndex = state.sentences[state.currentIndex].indexOf(state.selectedWord);
          if (startIndex !== -1) {
            state.annotations.push({
              text: state.selectedWord,
              label: tagName,
              start: startIndex,
              end: startIndex + state.selectedWord.length,
              color: color
            });
            updateSentence();
            state.selectedWord = "";
          }
        }
      });

      document.getElementById("tags").appendChild(newButton);
      document.getElementById("tag-name").value = "";
    }
  });

  document.getElementById("editable-div").addEventListener("mouseup", () => {
    const selection = window.getSelection().toString().trim();
    if (selection) state.selectedWord = selection;
  });

  document.getElementById("removeTag").addEventListener("click", () => {
    const untagWord = window.getSelection();
    if (untagWord.rangeCount > 0) {
      const range = untagWord.getRangeAt(0);
      const selectedNode = range.commonAncestorContainer;
      if (selectedNode.parentNode.tagName === "SPAN") {
        const spanNode = selectedNode.parentNode;
        const textContent = spanNode.textContent;
        const cleanText = textContent.replace(/\s?\([A-Z-]+\)/g, '').trim();
        spanNode.replaceWith(cleanText);

        const annotationIndex = state.annotations.findIndex(
          (annotation) => annotation.text.trim() === cleanText
        );

        if (annotationIndex !== -1) {
          state.annotations.splice(annotationIndex, 1);
        }

        updateSentence();
        untagWord.removeAllRanges();
      } else {
        alert('Please select a tagged word to untag.');
      }
    }
  });
}
