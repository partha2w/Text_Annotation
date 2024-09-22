import express from "express"
import bodyParser from "body-parser";
const app = express();

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.get("/",(req,res)=>{
    res.render("index.ejs")
})

app.post("/api/annotate",(req,res)=>{
    const {text} = req.body ;

    // Simulate annotated entities (this should come from your actual NLP logic)
    const annotatedEntities = [
        { "text": "অসম", "type": "LOCATION" },
        { "text": "ভাৰত", "type": "LOCATION" },
        { "text": "ব্ৰহ্মপুত্ৰ", "type": "RIVER" },
        { "text": "হিমালয়", "type": "LOCATION" },
        { "text": "শংকৰদেৱ", "type": "PERSON" },
        { "text": "মাধৱদেৱ", "type": "PERSON" },
        { "text": "কাজিৰঙা", "type": "LOCATION" },
        { "text": "নৱবৈষ্ণৱ", "type": "ORGANIZATION" },
        { "text": "গ্ৰীষ্ম", "type": "DATE" },
        { "text": "একশৃঙ্গ গঁড়", "type": "ANIMAL" }
    ];
    
    res.json({ annotatedEntities });
})

app.listen(4000,()=>{
    console.log("server started");
})