// server.js
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(bodyParser.text({ type: "*/*" }));

// Static file serving for the viewer
app.use("/static", express.static(path.join(__dirname, "static")));

app.post("/render", async (req, res) => {
  const xml = req.body;

  if (!xml || xml.trim() === "") {
    return res.status(400).send("No BPMN XML provided.");
  }

  const viewerPath = path.join(__dirname, "static", "viewer.html");

  if (!fs.existsSync(viewerPath)) {
    return res.status(500).send("viewer.html not found.");
  }

  const html = fs.readFileSync(viewerPath, "utf-8");
  const renderedHtml = html.replace("<!--__BPMN_XML__-->", xml);

  res.setHeader("Content-Type", "text/html");
  res.send(renderedHtml);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
