const annotations = []; // Array to store user annotations


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
      // Display the uploaded text in the contenteditable div
      const editableDiv = document.getElementById('editable-div');
      editableDiv.innerHTML = data.text.replace(/\n/g, '<br>'); // Handling newlines
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
var colors =["#B2EBF2", "#C8E6C9", "#FFD59B", "#D1C4E9", "#81D4FA", "#FFC59B", "#FFCCCB", "#FFF59D", "#EF9A9A", "#C8E6C9", "#CE93D8", "#81D4FA"];
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
      
      // Get the start and end positions of the selected text
      const originalText = document.getElementById("editable-div").innerText;
      const startIndex = originalText.indexOf(selectedWord);
      const endIndex = startIndex + selectedWord.length;
       
      annotations.push({
        text: selectedWord,
        label: tagName,
        start: startIndex,
        end: endIndex
      }); 

      // Reset selectedText after tagging
      selectedWord = '';
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
        annotations.splice(annotationIndex, 1); // Remove the annotation from array
        console.log(`Removed annotation`);
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
  fetch('/save-custom', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ annotations })
})
.then(response => response.json())
.then(data => alert("Saved, Now you can Download"))
.catch(error => console.error('Error saving annotations:', error));
})

document.getElementById("download-btn").addEventListener("click", function () {
  fetch('/download')
      .then(response => {
          if (!response.ok) throw new Error('Network response was not ok');
          return response.blob(); // Convert the response to a blob for download
      })
      .then(blob => {
          const url = window.URL.createObjectURL(blob); // Create a download URL
          const a = document.createElement('a'); // Create an anchor element
          a.style.display = 'none';
          a.href = url;
          a.download = 'annotated_file.txt'; // Set the file name for download
          document.body.appendChild(a); // Append the anchor to the body
          a.click(); // Programmatically click the anchor to trigger download
          window.URL.revokeObjectURL(url); // Revoke the object URL
          alert("Annotated file downloaded successfully!");
      })
      .catch(error => console.error('Error:', error));
});

