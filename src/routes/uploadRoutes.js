import express from "express";
import { uploadTextFile } from "../controllers/uploadController.js";
const router = express.Router();

router.post("/", uploadTextFile);

export default router;
