# Text Annotation Tool

## Overview
This project provides an annotation tool for text data, incorporating an automatic Named Entity Recognition (NER) feature using a backend model. The tool includes a Node.js-based Express server for the frontend and a Python FastAPI server for the NER model.

## Getting Started
Follow these steps to set up and run the project.

### 1. Setting Up the NER Model Backend
The NER model backend is built using Python and FastAPI. To install dependencies and start the server, follow these steps:

#### Navigate to the NER Model Backend Folder
```sh
cd NER_model_backend
```

#### Create and Activate a Virtual Environment
Run the following commands based on your operating system:

**For macOS/Linux:**
```sh
python -m venv venv
source venv/bin/activate
```

**For Windows (Command Prompt):**
```sh
python -m venv venv
venv\Scripts\activate
```

**For Windows (Git Bash):**
```sh
python -m venv venv
source venv/Scripts/activate
```

#### Install Dependencies
```sh
pip install torch transformers fastapi uvicorn
```

#### Start the NER Model Server
```sh
python -m uvicorn server:app --reload
```
or
```sh
uvicorn server:app --reload
```
Wait for the log "Application startup is complete"
This will start the FastAPI server, which will be used for automatic NER annotation.

### 2. Setting Up the Express Server
The frontend is built with Node.js and Express. Follow these steps to set it up:

#### Navigate to the Root Project Folder
If you're not already in the project folder, navigate there:
```sh
cd ../  # Ensure you're in the main project directory
```

#### Install Node.js Dependencies
```sh
npm install
```

#### Start the Express Server
```sh
node index.js
```

### 3. Accessing the Application
Once both the NER backend and the Express server are running, open your browser and go to:
```sh
http://localhost:4000/
```
The annotation tool will be displayed, and you can start using it.

## Summary of Commands
| Step                        | macOS/Linux                         | Windows (cmd)                     | Windows (Git Bash) |
|-----------------------------|-------------------------------------|-----------------------------------|------------------|
| Create Virtual Environment  | `python -m venv venv`             | `python -m venv venv`           | `python -m venv venv` |
| Activate Virtual Environment | `source venv/bin/activate`        | `venv\Scripts\activate`         | `source venv/Scripts/activate` |
| Install Python Dependencies | `pip install torch transformers fastapi uvicorn` | `pip install torch transformers fastapi uvicorn` | `pip install torch transformers fastapi uvicorn` |
| Start NER Model Server      | `python -m uvicorn server:app --reload` | `uvicorn server:app --reload` | `uvicorn server:app --reload` |
| Install Node Modules        | `npm install`                      | `npm install`                    | `npm install` |
| Start Express Server        | `node index.js`                    | `node index.js`                  | `node index.js` |

## Notes
- Ensure Python and Node.js are installed before running the setup.
- The NER backend must be running before using the annotation tool.
- Use a virtual environment to avoid dependency conflicts.

Now, you're all set to use the Text Annotation Tool!

