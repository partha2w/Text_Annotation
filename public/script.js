let sentences = []; // To store split sentences
let currentIndex = 0; // Current sentence index
let annotations = []; // To store tagging information

function updateSentence() {
  const sentenceDisplay = document.getElementById('editable-div');
  const currentSentence = sentences[currentIndex];

  // Apply annotations to the current sentence
  let annotatedSentence = currentSentence;
  annotations.forEach(({ text, label, start, end, color }) => {
      if (sentences[currentIndex].includes(text)) {
          const taggedText = `<span style="background-color: ${color};">${text} (${label})</span>`;
          annotatedSentence = annotatedSentence.replaceAll(text, taggedText);
      }
  });

  // Update the DOM
  sentenceDisplay.innerHTML = annotatedSentence;
  document.getElementById('totalSentences').textContent = `Sentence ${currentIndex + 1} of ${sentences.length}`;
}

// Showing annotation to user---------------------
function showAnnotations(data) {
  const container = document.getElementById("annotationsContainer");

  // Create a table
  const table = document.createElement("table");
  table.border = "1";

  // Create table header
  const headerRow = document.createElement("tr");
  headerRow.innerHTML = "<th>Text</th><th>Label</th>";
  table.appendChild(headerRow);

  // Populate table rows
  data.forEach(value => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${value.text}</td><td>${value.label}</td>`;
      table.appendChild(row);
  });

  // Append the table to the container
  container.innerHTML = ""; // Clear previous content
  container.appendChild(table);
}
// --------------------------
document.getElementById('prevButton').addEventListener('click', () => {
  currentIndex = (currentIndex - 1 + sentences.length) % sentences.length; // Loop back
  updateSentence();
});

document.getElementById('nextButton').addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % sentences.length; // Loop forward
  updateSentence();
});

// Handling upload----------
document.getElementById("upload-form").addEventListener('submit',function(e){
  e.preventDefault();
  const fileInput = document.getElementById("textFile").files[0];
  const formData = new FormData();
  formData.append('textFile',fileInput);

  fetch('/upload',{
      method: 'POST',
      body: formData
  })
  .then(response => response.json()) // Expecting JSON response from server
    .then(data => {
      sentences = data.text.split(/(?<=[।!?])/).filter(sentence => sentence.trim() !== '');
      currentIndex = 0;
      annotations = []; // Reset annotations for new content
      updateSentence(); // Show the first sentence
    })
  .catch(error=> console.error('Error: ',error));
});

// handling Annotation---------
document.getElementById("annotate-btn").addEventListener('click',function(){
  const text =document.getElementById("editable-div").innerHTML;
  
  fetch('/annotate',{
    method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({text})
  })
  .then(response=>response.json())
  .then(data =>{
    document.getElementById('editable-div').textContent = data.annotatedText;
    })
    .catch(error=> console.error('Error:',error));
});
  
// Adding Tagging-----------
let selectedWord = "";
var colors =[ "#FFD59B","#81D4FA", "#68C95D", "#D1C4E9","#FFF59D", "#81D4FA", "#FFC59B", "#FFCCCB",  "#EF9A9A", "#C8E6C9", "#CE93D8", "#B2EBF2"];
var colorIndex = 0;

document.getElementById("addTag").addEventListener('click',function(){
var tagName = document.getElementById("tag-name").value;
tagName = tagName.toUpperCase();
if(tagName!=""){
  var newButton = document.createElement("button");
  newButton.innerHTML = tagName;

  newButton.style.backgroundColor = colors[colorIndex];
  newButton.classList.add("tag-button");
  colorIndex = (colorIndex+1) % colors.length; 

  // Handling Manual selection------- 
  let color = newButton.style.backgroundColor;
  newButton.addEventListener('click',function(){
    if(selectedWord!=""){
      var paragraphElement = document.getElementById("editable-div");
      var paragraph = paragraphElement.innerHTML;

      // Replace the first occurrence of the selected text with a span
      var taggedText = `<span style="background-color: ${color};">${selectedWord} (${tagName})</span>`;
      paragraphElement.innerHTML = paragraph.replaceAll(selectedWord, taggedText);
      
      const startIndex = sentences[currentIndex].indexOf(selectedWord);
      if (startIndex !== -1) {
          annotations.push({
              text: selectedWord,
              label: tagName,
              start: startIndex,
              end: startIndex + selectedWord.length,
              color: color
          });
          updateSentence(); // Refresh the displayed sentence
          selectedWord = ""; // Reset selected word
      }
    }
  })

  document.getElementById("tags").appendChild(newButton);
  document.getElementById("tag-name").value = "";
}
});

// Handling Word Selection-----
document.getElementById("editable-div").addEventListener("mouseup",()=>{
const selection = window.getSelection().toString().trim();
if(selection){
  selectedWord = selection;
}
});

// Handling Untagging------
document.getElementById("removeTag").addEventListener("click",()=>{
const untagWord = window.getSelection();

if (untagWord.rangeCount > 0) {
  const range = untagWord.getRangeAt(0);

  const selectedNode = range.commonAncestorContainer;

  // Check if the selected text is inside a <span>
  if (selectedNode.parentNode.tagName === "SPAN") {
    const spanNode = selectedNode.parentNode;
    
      
      //Get the span's content
      const textContent = spanNode.textContent;

      const cleanText = textContent.replace(/\s?\([A-Z]+\)/g, '');

      // Replace the <span> with its plain text content, effectively untagging
      spanNode.replaceWith(cleanText);

      // Find and remove the annotation in the annotations array
      const annotationIndex = annotations.findIndex(
        (annotation) => annotation.text === cleanText
      );
    
      if (annotationIndex !== -1) {
        annotations.splice(annotationIndex, 1); // Remove the annotation from 
        updateSentence(); // Refresh the displayed sentence
      } else {
        console.warn("Annotation not found for the selected text.");
      }

      // Clear the selection after untagging
      untagWord.removeAllRanges();
  } else {
      alert('Please select a tagged word to untag.');
  }
}
});

// Saving the custom Tags-----------------
document.getElementById("save-annotations-btn").addEventListener("click",()=>{
  const tagFormat = document.getElementById("tag_format").value;
  const text = document.getElementById("editable-div").textContent;
  if(tagFormat==0){
    alert("Please choose an annotation Tagging Scheme to Save First!")
  }else{
    // Reconstruct the full paragraph with annotations applied
    const annotatedParagraph = sentences.map(sentence => {
      let annotatedSentence = sentence;
      annotations.forEach(({ text, label }) => {
          if (sentence.includes(text)) {
              const taggedText = `${text} (${label})`;
              annotatedSentence = annotatedSentence.replaceAll(text, taggedText);
          }
      });
      return annotatedSentence;
      }).join(" "); // Combine sentences into a full paragraph
      fetch('/save-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annotations,tagFormat,text:annotatedParagraph})
        })
        .then(response => {
          if (!response.ok) {
              throw new Error('Network response was not ok');
          }
          return response.json(); // Parse the JSON from the response
        })
        .then(data => {
          showAnnotations(data.annotations); //showing the annotation to user
          alert("Saved, Now you can Download");
        })
        .catch(error => console.error('Error saving annotations:', error));
  }
})

// Download the desired format-------------
document.getElementById("download-btn").addEventListener("click", function () {
  fetch('/download')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');

            // Extract the file name from the Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition');
            const fileName = contentDisposition
                ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') // Extract filename
                : 'default_filename.txt'; // Fallback filename if header is missing

            return response.blob().then(blob => ({ blob, fileName }));
        })
        .then(({ blob, fileName }) => {
            const url = window.URL.createObjectURL(blob); // Create a download URL
            const a = document.createElement('a'); // Create an anchor element
            a.style.display = 'none';
            a.href = url;
            a.download = fileName; // Set the extracted file name for download
            document.body.appendChild(a); // Append the anchor to the body
            a.click(); // Programmatically click the anchor to trigger download
            window.URL.revokeObjectURL(url); // Revoke the object URL
            alert("Annotated file downloaded successfully!");
        })
        .catch(error => console.error('Error:', error));
});

document.getElementById("annotate-btn").addEventListener("click",function(){
  alert("Automatic Annotation not yet Developed...  Please Wait!");
})

