import express from "express";
import { saveCustomAnnotation, downloadAnnotations } from "../controllers/annotationController.js";
const router = express.Router();

router.post("/save-custom", saveCustomAnnotation);
router.get("/download", downloadAnnotations);

export default router;
