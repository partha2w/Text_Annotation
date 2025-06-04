from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import torch
from transformers import AutoModelForTokenClassification, AutoTokenizer

from coreference_model import AssamesesCoreferenceResolver

app = FastAPI()

# # Initialize coreference resolver
coreference_resolver = AssamesesCoreferenceResolver()

# Pydantic model
class CoreferenceRequest(BaseModel):
    text: str

MODEL_PATHS = {
    "bert": "../assamese-ner-model",
    "indicner": "../ai4bharat"
}

tokenizers = {}
models = {}

for key, path in MODEL_PATHS.items():
    tokenizers[key] = AutoTokenizer.from_pretrained(path)
    models[key] = AutoModelForTokenClassification.from_pretrained(path)

# Define the Pydantic model for request body
class TextRequest(BaseModel):
    text: str
    model: Optional[str] = None

def get_bert_predictions(sentence, tokenizer, model, unwanted_tags=None):
    if unwanted_tags is None:
        unwanted_tags = {"B-WOA", "I-WOA"}
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
                predicted_labels.append("O")
            previous_token_id = word_ids[word_index]
    return predicted_labels

def get_indicner_predictions(sentence, tokenizer, model):
    max_length = tokenizer.model_max_length  # usually 512
    tok_sentence = tokenizer(
        sentence,
        return_tensors='pt',
        truncation=True,       # Truncate to max_length
        max_length=max_length  # Set max length
    )
    with torch.no_grad():
        logits = model(**tok_sentence).logits.argmax(-1)
        predicted_tokens_classes = [model.config.id2label[t.item()] for t in logits[0]]
        predicted_labels = []
        previous_token_id = 0
        word_ids = tok_sentence.word_ids()
        for word_index in range(len(word_ids)):
            if word_ids[word_index] is None:
                previous_token_id = word_ids[word_index]
            elif word_ids[word_index] == previous_token_id:
                previous_token_id = word_ids[word_index]
            else:
                predicted_labels.append(predicted_tokens_classes[word_index])
                previous_token_id = word_ids[word_index]
        return predicted_labels

@app.post("/predict")
async def predict_ner(request: TextRequest):
    text = request.text
    model_key = request.model

    if model_key not in models:
        return {"error": f"Model '{model_key}' not found. Available models: {list(models.keys())}"}

    tokenizer = tokenizers[model_key]
    model = models[model_key]

    if model_key == "indicner":
        predicted_labels = get_indicner_predictions(text, tokenizer, model)
    else:  # For "bert" or any other model
        predicted_labels = get_bert_predictions(text, tokenizer, model)

    return {"entities": predicted_labels}

@app.post("/coreference")
async def predict_coreference(request: CoreferenceRequest):
    """
    Coreference resolution endpoint
    """
    try:
        result = coreference_resolver.analyze(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Coreference processing failed: {str(e)}")
