const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const { render } = require("bpmn-to-image");

const app = express();
app.use(bodyParser.text({ type: "application/xml" }));

app.post("/render-bpmn", async (req, res) => {
  const bpmnXml = req.body;
  try {
    const result = await render(bpmnXml); // returns SVG buffer
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(result);
  } catch (err) {
    console.error("Rendering failed:", err);
    res.status(500).send("BPMN rendering failed");
  }
});

app.listen(3000, () => console.log("BPMN render server running on port 3000"));
