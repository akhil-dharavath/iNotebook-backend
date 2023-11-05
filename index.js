const connectToMongo = require("./db");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv").config();

connectToMongo();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT;

// Available routes
app.get("/", (req, res) => res.send("iNoteBook"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/notes", require("./routes/notes"));
app.use("*", (req, res) => {
  res.status(404).json({ success: false, error: "Endpoint not found" });
});

app.listen(port, () => {
  console.log(`iNoteBook is listening on port : ${port}`);
});
