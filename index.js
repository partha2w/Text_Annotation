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


app.get("/",(req,res)=>{
    res.render("index.ejs");
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

app.post("/save-custom",(req,res)=>{
    const { annotations } = req.body; // Receive annotations from the frontend
    annotationsData.annotations = annotations; // Update the annotation data
    res.json({ message: 'Annotations saved!' })
});

// Endpoint to download annotations as a .txt file
app.get("/download", (req, res) => {
    const annotationText = JSON.stringify(annotationsData, null, 2); // Format as JSON text
    res.setHeader("Content-Disposition", "attachment; filename=annotated_file.txt");
    res.setHeader("Content-Type", "application/json");
    res.send(annotationText); // Send the formatted JSON
});

app.listen(4000,()=>{
    console.log("server started");
})