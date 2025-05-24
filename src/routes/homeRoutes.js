import express from "express";
import { renderHome, renderAbout, renderCoreference, renderNER } from "../controllers/homeController.js";
const router = express.Router();

router.get("/", renderHome);
router.get("/about", renderAbout);
router.get("/ner", renderNER);
router.get("/coreference", renderCoreference);

export default router;
