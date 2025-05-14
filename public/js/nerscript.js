
let originalText = ""; // To store the raw original text
let sentences = []; // To store split sentences
let currentIndex = 0; // Current sentence index
let annotations = []; // To store tagging information

// Update the displayed sentence with annotations
function updateSentence() {
  const sentenceDisplay = document.getElementById('editable-div');
  let currentSentence = sentences[currentIndex]; // Start with the original sentence

  // Remove previous annotations by resetting to the original sentence
  let annotatedSentence = currentSentence; 

  annotations.forEach(({ text, label, color }) => {
    const taggedText = `<span style="background-color: ${color};">${text} (${label})</span>`;
    const regex = new RegExp(`(?<!>)${text}(?!<)`, "g"); 
    annotatedSentence = annotatedSentence.replace(regex, taggedText);
  });

  // Update the DOM
  sentenceDisplay.innerHTML = annotatedSentence;
  document.getElementById('totalSentences').textContent = `Sentence ${currentIndex + 1} of ${sentences.length}`;
}


// Showing annotation table to user---------------------
function showAnnotations(data) {
  const container = document.getElementById("annotationsContainer");

  // Create table with Tailwind classes
  const table = document.createElement("table");
  table.className = "min-w-full table-auto border-collapse border border-gray-300";

  // Create table header
  const headerRow = document.createElement("tr");
  headerRow.className = "bg-gray-200 text-left";
  headerRow.innerHTML = `
    <th class="border border-gray-300 px-4 py-2">Text</th>
    <th class="border border-gray-300 px-4 py-2">Label</th>
  `;
  table.appendChild(headerRow);

  // Populate table rows
  data.forEach(value => {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50";
    row.innerHTML = `
      <td class="border border-gray-300 px-4 py-2">${value.text}</td>
      <td class="border border-gray-300 px-4 py-2">${value.label}</td>
    `;
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

  const reader = new FileReader();
  reader.readAsText(fileInput); // Read file content as text

  reader.onload = function () {
    originalText = reader.result; // Store the original text
  };

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
// Handling Untagging------
document.getElementById("removeTag").addEventListener("click", () => {
  const untagWord = window.getSelection();

  if (untagWord.rangeCount > 0) {
    const range = untagWord.getRangeAt(0);
    const selectedNode = range.commonAncestorContainer;

    // Ensure selected text is inside a <span>
    if (selectedNode.parentNode.tagName === "SPAN") {
      const spanNode = selectedNode.parentNode;

      // Extract the plain text from the span (removing annotation label)
      const textContent = spanNode.textContent;
      const cleanText = textContent.replace(/\s?\([A-Z-]+\)/g, '').trim(); // Remove label like (B-LOC)

      // Replace the <span> with its plain text content
      spanNode.replaceWith(cleanText);

      // Find and remove the annotation in the annotations array
      const annotationIndex = annotations.findIndex(
        (annotation) => annotation.text.trim() === cleanText
      );

      if (annotationIndex !== -1) {
        annotations.splice(annotationIndex, 1); // Remove annotation
      }

      // Refresh sentence to reflect untagging
      updateSentence();

      // Clear selection after untagging
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



// Automatic annotation
async function analyzeText() {
  // check if original text empty or not
  if(originalText == "") {
    alert("Please upload a text file first!");
    return;
  }
  try {
    const response = await fetch("/analyze", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ originalText })
    });

    const data = await response.json();
    annotations = data.newAnnotations;
    updateSentence();
  } catch (error) {
    alert("Error fetching entities from Model:", error);
    console.error("Error:", error);
  }
}
