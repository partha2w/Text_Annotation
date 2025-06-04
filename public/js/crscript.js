document.addEventListener('DOMContentLoaded', () => {
  let currentSentenceIndex = 0;
  let sentences = [];
  let clusters = [];
  let selectedMentions = new Set();
  let colors = ['#FFB6C1', '#98FB98', '#87CEEB', '#DDA0DD', '#FFD700'];
  let currentClusterId = null;

  // Inject AI styles for coreference annotations
  const aiStyles = `
    .ai-mention {
      border: 2px dashed #3B82F6 !important;
      background: linear-gradient(45deg, transparent 25%, rgba(59, 130, 246, 0.1) 25%) !important;
    }
    
    .fa-robot {
      color: #3B82F6;
      font-size: 12px;
    }
    
    .ai-cluster {
      border-left: 4px solid #3B82F6;
      background: rgba(59, 130, 246, 0.05);
    }
  `;

  const styleSheet = document.createElement("style");
  styleSheet.textContent = aiStyles;
  document.head.appendChild(styleSheet);

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

  // AI Coreference Analysis Button Handler
  document.getElementById('analyze-btn').addEventListener('click', async () => {
    if (!sentences || sentences.length === 0) {
      alert("Please upload a text file first!");
      return;
    }

    // Show spinner and disable button
    const spinner = document.getElementById("loading-spinner");
    const button = document.getElementById("analyze-btn");

    spinner.style.display = "inline-block";
    button.disabled = true;
    button.style.opacity = 0.5;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';

    try {

      // Combine all sentences for analysis
      const textToAnalyze = sentences.join(' ');

      const response = await fetch("/coreference/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: textToAnalyze
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Coreference Analysis Result:", data);
      // Process the coreference results
      processCoreferenceResults(data);

    } catch (error) {
      alert("Error fetching coreference annotations: " + error.message);
      console.error("Coreference Error:", error);
    } finally {
      // Hide spinner and restore button
      spinner.style.display = "none";
      button.disabled = false;
      button.style.opacity = 1;
      button.innerHTML = '<i class="fas fa-magic mr-2"></i>AI Annotation';
    }
  });

  // Process coreference results and integrate with existing clusters
  function processCoreferenceResults(data) {
    if (!data.coreference_clusters || data.coreference_clusters.length === 0) {
      alert("No coreference clusters found by AI model");
      return;
    }

    let addedClusters = 0;
    let totalMentions = 0;

    // Process each AI cluster
    data.coreference_clusters.forEach((aiCluster) => {
      const clusterName = `AI-Cluster-${aiCluster.cluster_id}`;

      const newCluster = {
        id: clusters.length,
        name: clusterName,
        mentions: [],
        color: colors[clusters.length % colors.length],
        aiGenerated: true // Mark as AI-generated
      };

      // Convert AI mentions to your format
      aiCluster.mentions.forEach(aiMention => {
        const mentionInfo = findMentionInText(aiMention.text, aiMention.position);

        if (mentionInfo) {
          newCluster.mentions.push({
            text: aiMention.text,
            start: mentionInfo.start,
            end: mentionInfo.end,
            sentenceIndex: mentionInfo.sentenceIndex,
            aiGenerated: true,
            type: aiMention.type || 'UNKNOWN'
          });
          totalMentions++;
        }
      });

      // Only add cluster if it has valid mentions
      if (newCluster.mentions.length > 0) {
        clusters.push(newCluster);
        addedClusters++;
      }
    });

    // Update the display
    updateClustersDisplay();
    highlightMentions();

    // Show success message
    alert(`AI Analysis Complete!\nAdded ${addedClusters} clusters with ${totalMentions} mentions`);
  }

  // Helper function to find mention position in sentences
  function findMentionInText(mentionText, globalPosition) {
    let currentPos = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const sentenceStart = currentPos;
      const sentenceEnd = currentPos + sentence.length;

      // Check if the mention falls within this sentence
      if (globalPosition >= sentenceStart && globalPosition < sentenceEnd) {
        const localStart = globalPosition - sentenceStart;
        return {
          sentenceIndex: i,
          start: localStart,
          end: localStart + mentionText.length
        };
      }

      currentPos += sentence.length + 1; // +1 for space/separator
    }

    // Fallback: search for the mention text in sentences
    for (let i = 0; i < sentences.length; i++) {
      const index = sentences[i].indexOf(mentionText);
      if (index !== -1) {
        return {
          sentenceIndex: i,
          start: index,
          end: index + mentionText.length
        };
      }
    }

    return null;
  }

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
    updateClustersDisplay();
    document.getElementById('cluster-name').value = '';
  }

  function addToCluster(clusterId, mention) {
    clusters[clusterId].mentions.push(mention);
    updateClustersDisplay();
  }

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
  // Update the download button to handle different file extensions
  document.getElementById('download-btn').addEventListener('click', () => {
    const format = document.getElementById('tag_format').value;
    const data = convertToFormat(format);

    // Determine file extension and MIME type
    let fileExtension, mimeType;
    switch (format) {
      case 'conill':
        fileExtension = 'conll';
        mimeType = 'text/plain';
        break;
      case 'json':
        fileExtension = 'json';
        mimeType = 'application/json';
        break;
      case 'xml':
        fileExtension = 'xml';
        mimeType = 'application/xml';
        break;
      case 'txt':
        fileExtension = 'txt';
        mimeType = 'text/plain';
        break;
      default:
        fileExtension = 'json';
        mimeType = 'application/json';
    }

    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coreference_annotations.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  });

  function convertToFormat(format) {
    switch (format) {
      case 'conll':
        return convertToCONLL();
      case 'json':
        return convertToJSON();
      case 'xml':
        return convertToXML();
      case 'txt':
        return convertToTXT();
      default:
        return JSON.stringify(clusters, null, 2);
    }
  }

  // CoNLL-2012 format conversion
  function convertToCONLL() {
    let conllOutput = '';

    sentences.forEach((sentence, sentIndex) => {
      const words = sentence.split(/\s+/);

      words.forEach((word, wordIndex) => {
        const corefTags = [];

        // Find all clusters that have mentions in this position
        clusters.forEach((cluster, clusterId) => {
          cluster.mentions.forEach(mention => {
            if (mention.sentenceIndex === sentIndex) {
              const mentionWords = mention.text.split(/\s+/);
              const mentionStart = findWordPosition(sentence, mention.start);
              const mentionEnd = mentionStart + mentionWords.length - 1;

              if (wordIndex === mentionStart && wordIndex === mentionEnd) {
                // Single word mention
                corefTags.push(`(${clusterId})`);
              } else if (wordIndex === mentionStart) {
                // Start of multi-word mention
                corefTags.push(`(${clusterId}`);
              } else if (wordIndex === mentionEnd) {
                // End of multi-word mention
                corefTags.push(`${clusterId})`);
              }
            }
          });
        });

        const corefColumn = corefTags.length > 0 ? corefTags.join('|') : '-';

        // CoNLL format: word_index word pos lemma coref
        conllOutput += `${sentIndex}_${wordIndex}\t${word}\t-\t-\t${corefColumn}\n`;
      });

      conllOutput += '\n'; // Empty line between sentences
    });

    return conllOutput;
  }

  // Enhanced JSON format with metadata
  function convertToJSON() {
    const jsonData = {
      metadata: {
        total_sentences: sentences.length,
        total_clusters: clusters.length,
        creation_date: new Date().toISOString(),
        format_version: "1.0"
      },
      sentences: sentences.map((sentence, index) => ({
        id: index,
        text: sentence,
        length: sentence.length
      })),
      coreference_clusters: clusters.map((cluster, index) => ({
        cluster_id: index,
        cluster_name: cluster.name,
        color: cluster.color,
        ai_generated: cluster.aiGenerated || false,
        mention_count: cluster.mentions.length,
        mentions: cluster.mentions.map(mention => ({
          text: mention.text,
          sentence_id: mention.sentenceIndex,
          start_char: mention.start,
          end_char: mention.end,
          ai_generated: mention.aiGenerated || false,
          type: mention.type || "UNKNOWN"
        }))
      })),
      statistics: {
        total_mentions: clusters.reduce((sum, cluster) => sum + cluster.mentions.length, 0),
        ai_generated_clusters: clusters.filter(c => c.aiGenerated).length,
        manual_clusters: clusters.filter(c => !c.aiGenerated).length
      }
    };

    return JSON.stringify(jsonData, null, 2);
  }

  // XML format conversion
  function convertToXML() {
    let xmlOutput = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlOutput += '<coreference_annotation>\n';

    // Metadata
    xmlOutput += '  <metadata>\n';
    xmlOutput += `    <total_sentences>${sentences.length}</total_sentences>\n`;
    xmlOutput += `    <total_clusters>${clusters.length}</total_clusters>\n`;
    xmlOutput += `    <creation_date>${new Date().toISOString()}</creation_date>\n`;
    xmlOutput += '  </metadata>\n\n';

    // Sentences
    xmlOutput += '  <sentences>\n';
    sentences.forEach((sentence, index) => {
      xmlOutput += `    <sentence id="${index}">\n`;
      xmlOutput += `      <text><![CDATA[${sentence}]]></text>\n`;
      xmlOutput += `    </sentence>\n`;
    });
    xmlOutput += '  </sentences>\n\n';

    // Clusters
    xmlOutput += '  <clusters>\n';
    clusters.forEach((cluster, index) => {
      xmlOutput += `    <cluster id="${index}" name="${escapeXML(cluster.name)}" color="${cluster.color}"`;
      if (cluster.aiGenerated) {
        xmlOutput += ` ai_generated="true"`;
      }
      xmlOutput += '>\n';

      cluster.mentions.forEach(mention => {
        xmlOutput += '      <mention>\n';
        xmlOutput += `        <text><![CDATA[${mention.text}]]></text>\n`;
        xmlOutput += `        <sentence_id>${mention.sentenceIndex}</sentence_id>\n`;
        xmlOutput += `        <start_char>${mention.start}</start_char>\n`;
        xmlOutput += `        <end_char>${mention.end}</end_char>\n`;
        if (mention.aiGenerated) {
          xmlOutput += `        <ai_generated>true</ai_generated>\n`;
        }
        if (mention.type) {
          xmlOutput += `        <type>${mention.type}</type>\n`;
        }
        xmlOutput += '      </mention>\n';
      });

      xmlOutput += '    </cluster>\n';
    });
    xmlOutput += '  </clusters>\n';
    xmlOutput += '</coreference_annotation>';

    return xmlOutput;
  }

  // Plain text format conversion
  function convertToTXT() {
    let txtOutput = 'COREFERENCE ANNOTATION REPORT\n';
    txtOutput += '================================\n\n';

    txtOutput += `Total Sentences: ${sentences.length}\n`;
    txtOutput += `Total Clusters: ${clusters.length}\n`;
    txtOutput += `Total Mentions: ${clusters.reduce((sum, cluster) => sum + cluster.mentions.length, 0)}\n`;
    txtOutput += `AI Generated Clusters: ${clusters.filter(c => c.aiGenerated).length}\n`;
    txtOutput += `Manual Clusters: ${clusters.filter(c => !c.aiGenerated).length}\n\n`;

    // Sentences
    txtOutput += 'SENTENCES:\n';
    txtOutput += '----------\n';
    sentences.forEach((sentence, index) => {
      txtOutput += `[${index + 1}] ${sentence}\n`;
    });
    txtOutput += '\n';

    // Clusters
    txtOutput += 'COREFERENCE CLUSTERS:\n';
    txtOutput += '---------------------\n';
    clusters.forEach((cluster, index) => {
      txtOutput += `\nCluster ${index + 1}: ${cluster.name}`;
      if (cluster.aiGenerated) {
        txtOutput += ' [AI Generated]';
      }
      txtOutput += '\n';
      txtOutput += `Color: ${cluster.color}\n`;
      txtOutput += `Mentions (${cluster.mentions.length}):\n`;

      cluster.mentions.forEach((mention, mentionIndex) => {
        txtOutput += `  ${mentionIndex + 1}. "${mention.text}" `;
        txtOutput += `(Sentence ${mention.sentenceIndex + 1}, `;
        txtOutput += `Chars ${mention.start}-${mention.end})`;
        if (mention.aiGenerated) {
          txtOutput += ' [AI]';
        }
        txtOutput += '\n';
      });
    });

    return txtOutput;
  }

  // Helper functions
  function findWordPosition(sentence, charPosition) {
    const words = sentence.substring(0, charPosition).split(/\s+/);
    return words.length - 1;
  }

  function escapeXML(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
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

  // Updated clusters display with AI indicators
  function updateClustersDisplay() {
    const container = document.getElementById('clusters');
    container.innerHTML = '<h3 class="text-xl font-bold mb-4">Coreference Clusters</h3>';

    clusters.forEach((cluster, index) => {
      const clusterDiv = document.createElement('div');
      clusterDiv.className = `cluster mb-6 rounded-lg border border-gray-300 shadow-md ${cluster.aiGenerated ? 'ai-cluster' : ''}`;

      // Add special styling for AI-generated clusters
      const aiIndicator = cluster.aiGenerated ?
        '<i class="fas fa-robot ml-2 text-blue-600" title="AI Generated"></i>' : '';

      clusterDiv.innerHTML = `
      <div class="flex items-center justify-between px-4 py-3 rounded-t-lg ${cluster.aiGenerated ? 'border-2 border-dashed border-blue-400' : ''}" 
           style="background: ${cluster.color}">
        <span class="text-black font-semibold text-lg">
          ${cluster.name}
          ${aiIndicator}
        </span>
        <div class="space-x-2">
          <button 
            class="select-cluster px-3 py-1 text-sm font-medium bg-white text-gray-800 rounded hover:bg-gray-100 transition"
            data-id="${index}">
            Select
          </button>
          <button 
            class="delete-cluster px-3 py-1 text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700 transition"
            data-id="${index}">
            Delete
          </button>
        </div>
      </div>
      <div class="mentions p-2">
        ${cluster.mentions.map(m => `
          <span class="cluster-mention ${m.aiGenerated ? 'ai-mention' : ''}" 
                data-start="${m.start}" 
                data-end="${m.end}"
                data-sentence="${m.sentenceIndex}"
                title="${m.aiGenerated ? 'AI Generated' : 'Manual'}">
            ${m.text}
            ${m.aiGenerated ? '<i class="fas fa-robot text-xs text-blue-600"></i>' : ''}
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
