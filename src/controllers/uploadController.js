import { annotationsData } from "../state.js";

export const uploadTextFile = (req, res) => {
  const textFile = req.files?.textFile;
  if (!textFile) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const text = textFile.data.toString();
  annotationsData.originalText = text;
  annotationsData.annotations = [];
  res.json({ text });
};