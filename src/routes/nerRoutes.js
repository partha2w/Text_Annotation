import express from "express";
import { renderNER, analyzeNER } from "../controllers/nerController.js";
const router = express.Router();

router.get("/", renderNER);
router.post("/analyze", analyzeNER);

export default router;
