import { annotationsData, formattedAnnotations, tagFormat } from "../state.js";

export const saveCustomAnnotation = (req, res) => {
  const { annotations } = req.body;
  const text = req.body.text;
  const tagFormat = req.body.tagFormat;
  annotationsData.annotations = annotations;

  const singleWords = text.split(" ");
  const allWords = singleWords.filter(word => !/^\(.*\)$/.test(word));
  const wordTagMap = {};

  allWords.forEach(word => {
    wordTagMap[word] = "O";
  });

  annotations.forEach(annotation => {
    const words = annotation.text.split(" ");
    const label = annotation.label;
    switch (tagFormat) {
      case "BIO":
        words.forEach((word, index) => {
          wordTagMap[word] = index === 0 ? `B-${label}` : `I-${label}`;
        });
        break;
      case "IO":
        words.forEach(word => {
          wordTagMap[word] = `I-${label}`;
        });
        break;
      case "BILUO":
        words.forEach((word, index) => {
          if (words.length === 1) {
            wordTagMap[word] = `U-${label}`;
          } else if (index === 0) {
            wordTagMap[word] = `B-${label}`;
          } else if (index === words.length - 1) {
            wordTagMap[word] = `L-${label}`;
          } else {
            wordTagMap[word] = `I-${label}`;
          }
        });
        break;
      case "BIL2":
        words.forEach((word, index) => {
          wordTagMap[word] = index === 0 ? `B-${label}` : `I-${label}`;
        });
        break;
      default:
        break;
    }
  });

  formattedAnnotations.length = 0;
  allWords.forEach(word => {
    formattedAnnotations.push({ word, tag: wordTagMap[word] });
  });

  res.json({
    message: 'Annotations saved!',
    annotations: annotationsData.annotations
  });
};

export const downloadAnnotations = (req, res) => {
  if (tagFormat == "JSON") {
    const annotationText = JSON.stringify(annotationsData, null, 2);
    res.setHeader("Content-Disposition", "attachment; filename=annotated_file.txt");
    res.setHeader("Content-Type", "application/json");
    res.send(annotationText);
  } else {
    const formattedAnnotationsText = formattedAnnotations
      .map(item => `${item.word}\t${item.tag}`)
      .join("\n");
    res.setHeader("Content-Disposition", `attachment; filename="annotated_${tagFormat}.txt"`);
    res.setHeader("Content-Type", "text/plain");
    res.send(formattedAnnotationsText);
  }
};
