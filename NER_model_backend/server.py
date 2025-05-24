from fastapi import FastAPI
from pydantic import BaseModel
import torch
from transformers import AutoModelForTokenClassification, AutoTokenizer

app = FastAPI()

# Load the AI4Bharat IndicNER model
model_name = "../assamese-ner-model"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForTokenClassification.from_pretrained(model_name)

class TextRequest(BaseModel):
    text: str

# Function to get model predictions
def get_predictions(sentence, tokenizer, model, unwanted_tags=None):
    if unwanted_tags is None:
        unwanted_tags = {"B-WOA", "I-WOA"}  # Add more tags you want to ignore

    tok_sentence = tokenizer(sentence, return_tensors='pt', is_split_into_words=False)
    with torch.no_grad():
        logits = model(**tok_sentence).logits.argmax(-1)
    predicted_tokens_classes = [model.config.id2label[t.item()] for t in logits[0]]

    predicted_labels = []
    previous_token_id = None
    word_ids = tok_sentence.word_ids()
    for word_index in range(len(word_ids)):
        if word_ids[word_index] is None:
            previous_token_id = word_ids[word_index]
        elif word_ids[word_index] == previous_token_id:
            previous_token_id = word_ids[word_index]
        else:
            label = predicted_tokens_classes[word_index]
            if label not in unwanted_tags:
                predicted_labels.append(label)
            else:
                predicted_labels.append("O")  # Or skip, or set to "O" for outside
            previous_token_id = word_ids[word_index]
    return predicted_labels


@app.post("/predict")
async def predict_ner(request: TextRequest):
    text = request.text
    predicted_labels = get_predictions(text, tokenizer, model)
    
    return {"entities": predicted_labels}  # Return a JSON serializable response