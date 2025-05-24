import app from "./src/app.js";
const port = 4000;

app.listen(port, () => {
  console.log("server started at port: " + port);
});
