var colors = ['#FF8484','#FFF584','#9FFF84','#84FFE9','#8497FF','#C084FF','#FF84D8','#FFC484','#84FF99','#ED84FF']
var colorIndex = 0;

var selectedText = "";

function addTag(){
    var tagName = document.getElementById("tag-name").value;
    tagName = tagName.toUpperCase();
    if(tagName !=' '){
        var newButton = document.createElement("button");
        newButton.innerHTML = tagName;

        newButton.style.backgroundColor = colors[colorIndex];
        newButton.classList.add("tag-button");

        colorIndex = (colorIndex+1) % colors.length;

        newButton.addEventListener("click",function(){
            if(selectedText !==''){
                tagSelectedWord(tagName,newButton.style.backgroundColor);
            }
        })

        document.getElementById("tags").appendChild(newButton);
        document.getElementById("tag-name").value = "";
    }
}

 // Function to handle text selection in the sentence
 document.getElementById("editable-div").addEventListener('mouseup', function() {
    selectedText = getSelectedText();
});

// Function to get the selected text
function getSelectedText() {
    var text = '';
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type !== "Control") {
        text = document.selection.createRange().text;
    }
    return text;
}

 // Function to wrap the selected word with a span and assign the tag name and color
function tagSelectedWord(tagName,color){
    var paragraphElement = document.getElementById("editable-div");
    var paragraph = paragraphElement.innerHTML;

    // Replace the first occurrence of the selected text with a span
    var taggedText = `<span style="background-color: ${color};">${selectedText} (${tagName})</span>`;
    paragraphElement.innerHTML = paragraph.replaceAll(selectedText, taggedText);

    // Reset selectedText after tagging
    selectedText = '';
 }




// handle text file upload--
function uploadFile(){
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    if(!file){
        alert('Please Upload a file');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        // Display the file content in the editable div
        const textContent = e.target.result;
        document.getElementById('editable-div').textContent = textContent;

        fetch('/api/annotate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textContent }) // Send the text as JSON
        })
        .then(response => response.json()) // Parse the JSON response
        .then(data => {
            // Handle the response and highlight the entities
            highlightEntities(data.annotatedEntities);
            
        })
        .catch(error => {
            console.error('Error:', error); // Handle any errors
        });
    };

    reader.readAsText(file, 'UTF-8');
} 


function highlightEntities(annotatedEntities) {
    let editableDiv = document.getElementById('editable-div');
    let content = editableDiv.innerHTML;

    // Loop through the entities and wrap them in <span> tags with appropriate classes
    annotatedEntities.forEach(entity => {
        let regex = new RegExp(`(${entity.text})`, 'g');
        let spanClass = '';

        // Apply classes based on entity type
        if (entity.type === 'PERSON') {
            spanClass = 'entity-person';
        } else if (entity.type === 'LOCATION') {
            spanClass = 'entity-location';
        }else if (entity.type === 'ORGANIZATION') {
            spanClass = 'entity-org';
        }else if (entity.type === 'RIVER') {
            spanClass = 'entity-river';
        }else if (entity.type === 'ANIMAL') {
            spanClass = 'entity-animal';
        }else if (entity.type === 'DATE') {
            spanClass = 'entity-date';
        }

        // Replace entity text with wrapped span
        content = content.replace(regex, `<span class="${spanClass}">$1</span>`);
});

// Update the content with highlighted text
editableDiv.innerHTML = content;
}
