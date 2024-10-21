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

let memoryStorage = {};

app.get("/",(req,res)=>{
    res.render("index.ejs");
})

app.post('/upload',(req,res)=>{
    const textFile = req.files?.textFile;
    if (!textFile) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const text = textFile.data.toString();
    
    // Store the text in memory with a unique ID
    const id = Date.now();  
    memoryStorage[id] = { text, annotations: [] };
    
    // Render the EJS template with the uploaded text
    res.json({ text });
});

app.post('/annotate',(req,res)=>{
    const { id, annotation } = req.body;
    if (!memoryStorage[id]) {
        return res.status(404).json({ error: 'Text not found' });
    }

    // Add annotation to the in-memory storage
    memoryStorage[id].annotations.push(annotation);
    
    res.status(200).json({ message: 'Annotation saved', annotations: memoryStorage[id].annotations });
})


// app.post("/api/annotate",(req,res)=>{
//     const {text} = req.body ;

//     // Simulate annotated entities (this should come from your actual NLP logic)
//     const annotatedEntities = [
//         { "text": "অসম", "type": "LOCATION" },
//         { "text": "ভাৰত", "type": "LOCATION" },
//         { "text": "ব্ৰহ্মপুত্ৰ", "type": "RIVER" },
//         { "text": "হিমালয়", "type": "LOCATION" },
//         { "text": "শংকৰদেৱ", "type": "PERSON" },
//         { "text": "মাধৱদেৱ", "type": "PERSON" },
//         { "text": "কাজিৰঙা", "type": "LOCATION" },
//         { "text": "নৱবৈষ্ণৱ", "type": "ORGANIZATION" },
//         { "text": "গ্ৰীষ্ম", "type": "DATE" },
//         { "text": "একশৃঙ্গ গঁড়", "type": "ANIMAL" }
//     ];
    
//     res.json({ annotatedEntities }); 
// })

app.listen(4000,()=>{
    console.log("server started");
})