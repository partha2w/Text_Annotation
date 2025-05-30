import express from "express";
import { renderCoreference } from "../controllers/coreferenceController.js";
const router = express.Router();

router.get("/", renderCoreference);

export default router;
