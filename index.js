import express from "express";
import bodyParser from "body-parser";
import fileUpload from "express-fileupload";
import cors from "cors";
const app = express();

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(cors());
app.use(fileUpload());

// In-memory storage for the original text and annotations
let text = null;
let annotationsData = {};
let formattedAnnotations = [];
let tagFormat;


app.get("/",(req,res)=>{
    res.render("index.ejs");
})

app.get("/about",(req,res)=>{
    res.render("about.ejs");
})

app.post('/upload',(req,res)=>{
    const textFile = req.files?.textFile;
    if (!textFile) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    text = textFile.data.toString();
    
    annotationsData = {
        originalText: text,
        annotations: [] // Store user NER tags here
    };
    
    res.json({ text });
});

app.post('/annotate',(req,res)=>{
// auto aunottation---
});

// ----------Save Custom Annotation----------------------
app.post("/save-custom", (req, res) => {
  const { annotations } = req.body;
  text = req.body.text;
  tagFormat = req.body.tagFormat;
  annotationsData.annotations = annotations;

  // Split the full text into words
  const allWords = text.split(" ");
  const wordTagMap = {}; // To map words to their tags

  // Initialize all words as non-entity (O)
  allWords.forEach(word => {
    wordTagMap[word] = "O";
  });

  // Process each annotation
  annotations.forEach(annotation => {
    const words = annotation.text.split(" "); // Split entity into words
    const label = annotation.label;

    // Determine tags for the annotation based on the selected format
    switch (tagFormat) {
      case "BIO":
        words.forEach((word, index) => {
          wordTagMap[word] = index === 0 ? `B-${label}` : `I-${label}`; // B- for the first, I- for subsequent
        });
        break;

      case "IO":
        words.forEach(word => {
          wordTagMap[word] = `I-${label}`; // All words in the entity get I-
        });
        break;

      case "BILUO":
        words.forEach((word, index) => {
          if (words.length === 1) {
            wordTagMap[word] = `U-${label}`; // Single-word entity
          } else if (index === 0) {
            wordTagMap[word] = `B-${label}`; // First word in multi-word entity
          } else if (index === words.length - 1) {
            wordTagMap[word] = `L-${label}`; // Last word in multi-word entity
          } else {
            wordTagMap[word] = `I-${label}`; // Intermediate words
          }
        });
        break;

      case "BIL2":
        words.forEach((word, index) => {
          wordTagMap[word] = index === 0 ? `B-${label}` : `I-${label}`; // Same as BIO for now
        });
        break;

      default:
        break;
    }
  });

  // Create the formatted annotations array
    formattedAnnotations = allWords.map(word => ({
    word,
    tag: wordTagMap[word]
  }));

  // Output the result for debugging
  res.json({
    message: 'Annotations saved!',
    annotations: annotationsData.annotations // Include the array here
  });
});


// ---------Endpoint to download annotations as a .txt file-----------
app.get("/download", (req, res) => {
    if(tagFormat=="JSON"){
      const annotationText = JSON.stringify(annotationsData, null, 2); // Format as JSON text
      res.setHeader("Content-Disposition", "attachment; filename=annotated_file.txt");
      res.setHeader("Content-Type", "application/json");
      res.send(annotationText); // Send the formatted JSON
    }else{
    // Convert to plain text format
    const formattedAnnotationsText = formattedAnnotations
        .map(item => `${item.word}\t${item.tag}`) // Format as "word\ttag"
        .join("\n"); // Join lines with a newline character

    // Set headers for file download
    res.setHeader("Content-Disposition", `attachment; filename="annotated_${tagFormat}.txt"`);
    res.setHeader("Content-Type", "text/plain");

    res.send(formattedAnnotationsText);
    }
});

app.listen(4000,()=>{
    console.log("server started");
})