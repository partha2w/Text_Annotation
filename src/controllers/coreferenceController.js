import axios from "axios";
export const renderCoreference = (req, res) => res.render("coreference.ejs");

export const analyzeCoreference = async (req, res) => {
    try {
      const { text } = req.body;
      
      console.log("Analyzing coreference for text:");
      
      // Call FastAPI coreference endpoint
      const response = await axios.post("http://127.0.0.1:8000/coreference", { 
        text: text 
      });
      
      console.log(`Coreference analysis complete. Found ${response.data.total_clusters} clusters`);
      
      // Return the response directly to frontend
      res.json(response.data);
      
    } catch (error) {
      console.error("Coreference analysis error:", error);
      
      if (error.response) {
        res.status(error.response.status).json({ 
          error: "Coreference analysis failed", 
          details: error.response.data 
        });
      } else {
        res.status(500).json({ 
          error: "Failed to analyze coreference", 
          details: error.message 
        });
      }
    }
  };
  