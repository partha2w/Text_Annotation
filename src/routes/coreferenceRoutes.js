import express from "express";
import { renderCoreference, analyzeCoreference } from "../controllers/coreferenceController.js";
const router = express.Router();

router.get("/", renderCoreference);
router.post("/analyze", analyzeCoreference);

export default router;
