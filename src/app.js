import express from "express";
import bodyParser from "body-parser";
import fileUpload from "express-fileupload";
import cors from "cors";
import path from "path";
import homeRoutes from "./routes/homeRoutes.js";
import nerRoutes from "./routes/nerRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import annotationRoutes from "./routes/annotationRoutes.js";
import coreferenceRoutes from "./routes/coreferenceRoutes.js";

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.resolve('views'));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(fileUpload());

app.use("/", homeRoutes);
app.use("/ner", nerRoutes);
app.use("/coreference", coreferenceRoutes);
app.use("/upload", uploadRoutes);
app.use("/annotation", annotationRoutes);

export default app;