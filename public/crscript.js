document.addEventListener('DOMContentLoaded', () => {
  let currentSentenceIndex = 0;
  let sentences = [];
  let clusters = [];
  let selectedMentions = new Set();
  let colors = ['#FFB6C1', '#98FB98', '#87CEEB', '#DDA0DD', '#FFD700'];
  let currentClusterId = null;

  // File Upload Handling
  document.getElementById('upload-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const file = document.getElementById('textFile').files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        processText(e.target.result);
        document.getElementById('editable-div').textContent = sentences[currentSentenceIndex];
        updateSentenceCounter();
      };
      reader.readAsText(file);
    }
  });

  // Process uploaded text
  function processText(text) {
    // Simple sentence splitting (improve this for Assamese)
    sentences = text.split(/(?<=।|\?|!)/).filter(s => s.trim());
    currentSentenceIndex = 0;
    clusters = [];
    updateSentenceCounter();
  }

  // Sentence Navigation
  document.getElementById('nextButton').addEventListener('click', () => {
    if (currentSentenceIndex < sentences.length - 1) {
      currentSentenceIndex++;
      updateDisplay();
    }
  });

  document.getElementById('prevButton').addEventListener('click', () => {
    if (currentSentenceIndex > 0) {
      currentSentenceIndex--;
      updateDisplay();
    }
  });

  // Text Selection Handling
  document.getElementById('editable-div').addEventListener('mouseup', () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString().trim();

      if (selectedText) {
        showSelectionPopup(range);
      }
    }
  });

  function showSelectionPopup(range) {
    // Remove existing popups
    document.querySelectorAll('.mention-popup').forEach(p => p.remove());

    const popup = document.createElement('div');
    popup.className = 'mention-popup';
    popup.innerHTML = `
          <button class="add-mention">Add as Mention</button>
      `;

    const rect = range.getBoundingClientRect();
    popup.style.position = 'absolute';
    popup.style.top = `${rect.bottom + window.scrollY}px`;
    popup.style.left = `${rect.left + window.scrollX}px`;

    popup.querySelector('.add-mention').addEventListener('click', () => {
      addMention(range);
      popup.remove();
    });

    document.body.appendChild(popup);
  }

  // Update addMention function to handle new clusters
  function addMention(range) {
    const mentionText = range.toString().trim();
    const startOffset = range.startOffset;
    const endOffset = range.endOffset;

    // Check if creating new cluster
    const isNewCluster = currentClusterId === null ||
      document.getElementById('cluster-name').value.trim() !== '';

    if (isNewCluster) {
      currentClusterId = null;
      document.getElementById('cluster-name').value = '';
    }

    // Create new cluster if needed
    if (currentClusterId === null) {
      createNewCluster({
        text: mentionText,
        start: startOffset,
        end: endOffset,
        sentenceIndex: currentSentenceIndex
      });
    } else {
      addToCluster(currentClusterId, {
        text: mentionText,
        start: startOffset,
        end: endOffset,
        sentenceIndex: currentSentenceIndex
      });
    }

    highlightMentions();
  }


  // Update cluster creation logic
  function createNewCluster(mention) {
    const clusterName = document.getElementById('cluster-name').value || `Cluster ${clusters.length + 1}`;
    const cluster = {
      id: clusters.length,
      name: clusterName,
      mentions: [mention],
      color: colors[clusters.length % colors.length]
    };
    clusters.push(cluster);
    currentClusterId = cluster.id;
    document.getElementById('cluster-name').value = '';
    updateClustersDisplay();
  }


  function addToCluster(clusterId, mention) {
    clusters[clusterId].mentions.push(mention);
    updateClustersDisplay();
  }

  // Modify the delete functionality in crscript.js
  document.getElementById('removeMentions').addEventListener('click', () => {
    // Delete entire cluster if cluster is selected
    if (currentClusterId !== null) {
      clusters = clusters.filter((_, idx) => idx !== currentClusterId);
      currentClusterId = null;
    }
    // Delete selected mentions
    else {
      const selectedMentions = document.querySelectorAll('.mention.selected');
      selectedMentions.forEach(mention => {
        const clusterId = parseInt(mention.dataset.clusterId);
        clusters[clusterId].mentions = clusters[clusterId].mentions.filter(m =>
          !(m.start === parseInt(mention.dataset.start) &&
            m.sentenceIndex === currentSentenceIndex
          ));
        mention.replaceWith(mention.textContent);
      });
    }
    updateClustersDisplay();
    highlightMentions();
  });

  // Save Annotations
  document.getElementById('save-annotations-btn').addEventListener('click', () => {
    const annotationData = {
      sentences: sentences,
      clusters: clusters.map(cluster => ({
        ...cluster,
        mentions: cluster.mentions.map(mention => ({
          ...mention,
          sentence: sentences[mention.sentenceIndex]
        }))
      }))
    };
    localStorage.setItem('annotations', JSON.stringify(annotationData));
    alert('Annotations saved successfully!');
  });

  // Download Annotations
  document.getElementById('download-btn').addEventListener('click', () => {
    const format = document.getElementById('tag_format').value;
    const data = convertToFormat(format);

    const blob = new Blob([data], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `annotations.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  });

  function convertToFormat(format) {
    // Implement conversion logic for different formats
    switch (format) {
      case 'conill':
        return convertToCONLL();
      case 'json':
        return JSON.stringify(clusters, null, 2);
      case 'xml':
        return convertToXML();
      default:
        return JSON.stringify(clusters);
    }
  }

  // Helper Functions
  function updateDisplay() {
    document.getElementById('editable-div').textContent = sentences[currentSentenceIndex];
    updateSentenceCounter();
    highlightMentions();
  }

  function updateSentenceCounter() {
    document.getElementById('totalSentences').textContent =
      `Sentence ${currentSentenceIndex + 1} of ${sentences.length}`;
  }

  function highlightMentions() {
    clusters.forEach(cluster => {
      cluster.mentions.forEach(mention => {
        if (mention.sentenceIndex === currentSentenceIndex) {
          const span = document.createElement('span');
          span.className = 'mention';
          span.style.backgroundColor = cluster.color;
          span.textContent = mention.text;
          document.getElementById('editable-div').innerHTML =
            document.getElementById('editable-div').innerHTML.replace(
              mention.text,
              span.outerHTML
            );
        }
      });
    });
  }

  // Update clusters display with spacing and delete buttons
  function updateClustersDisplay() {
    const container = document.getElementById('clusters');
    container.innerHTML = '<h3>Coreference Clusters</h3>';

    clusters.forEach((cluster, index) => {
      const clusterDiv = document.createElement('div');
      clusterDiv.className = 'cluster';
      clusterDiv.innerHTML = `
          <div class="cluster-header" style="background: ${cluster.color}">
              ${cluster.name}
              <button class="select-cluster" data-id="${index}">Select</button>
              <button class="delete-cluster" data-id="${index}">Delete</button>
          </div>
          <div class="mentions">
              ${cluster.mentions.map(m => `
                  <span class="cluster-mention" 
                        data-start="${m.start}" 
                        data-end="${m.end}"
                        data-sentence="${m.sentenceIndex}">
                      ${m.text}
                      <span class="delete-mention">×</span>
                  </span>
              `).join(' ')}
          </div>
      `;
      container.appendChild(clusterDiv);
    });

    // Add cluster selection handlers
    document.querySelectorAll('.select-cluster').forEach(button => {
      button.addEventListener('click', () => {
        currentClusterId = parseInt(button.dataset.id);
        document.querySelectorAll('.cluster-header').forEach(h =>
          h.style.border = 'none');
        button.parentElement.style.border = '2px solid black';
      });
    });

    // Add cluster deletion handlers
    document.querySelectorAll('.delete-cluster').forEach(button => {
      button.addEventListener('click', (e) => {
        clusters = clusters.filter((_, idx) => idx !== parseInt(button.dataset.id));
        currentClusterId = null;
        updateClustersDisplay();
        highlightMentions();
        e.stopPropagation();
      });
    });

    // Add mention deletion handlers
    document.querySelectorAll('.delete-mention').forEach(span => {
      span.addEventListener('click', (e) => {
        const mentionElem = span.parentElement;
        const clusterId = parseInt(mentionElem.closest('.cluster').querySelector('.select-cluster').dataset.id);

        clusters[clusterId].mentions = clusters[clusterId].mentions.filter(m =>
          !(m.start === parseInt(mentionElem.dataset.start) &&
            m.sentenceIndex === parseInt(mentionElem.dataset.sentence))
        );

        updateClustersDisplay();
        highlightMentions();
        e.stopPropagation();
      });
    });
  }
});


