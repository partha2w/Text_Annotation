import axios from "axios";
import { annotationsData, text, formattedAnnotations } from "../state.js";

export const renderNER = (req, res) => res.render("ner.ejs");

export const analyzeNER = async (req, res) => {
  try {
    const { model } = req.body;
    const response = await axios.post("http://127.0.0.1:8000/predict", { text: annotationsData.originalText,model: model });
    const labels = response.data.entities;
    const words = annotationsData.originalText.split(/\s+/);
    let newAnnotations = annotationsData.annotations;
    let startIndex = 0;

    words.forEach((word, index) => {
      let label = labels[index] || "O";
      if (label !== "O") {
        newAnnotations.push({
          text: word,
          label: label,
          start: startIndex,
          end: startIndex + word.length,
          color: "#D3D3D3"
        });
      }
      startIndex += word.length + 1;
    });
    res.json({ newAnnotations });
  } catch (error) {
    console.error("Error fetching entities:", error);
    res.status(500).json({ error: "Failed to analyze text" });
  }
};
