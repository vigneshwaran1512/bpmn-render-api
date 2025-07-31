const path = require("path");
process.env.PUPPETEER_CACHE_DIR = path.join(__dirname, ".cache");

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const { convert } = require("bpmn-to-image");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.text({ type: "application/xml" }));

app.post("/render", async (req, res) => {
  try {
    const xml = req.body;
    if (!xml) {
      return res.status(400).json({ error: "No BPMN XML provided" });
    }

    const tempFile = path.join(__dirname, `${uuidv4()}.bpmn`);
    fs.writeFileSync(tempFile, xml);

    const outputDir = path.join(__dirname, "output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const { png } = await convert(tempFile, { format: "png", outputDir });
    const image = fs.readFileSync(png);

    res.set("Content-Type", "image/png");
    res.send(image);

    // Clean up
    fs.unlinkSync(tempFile);
    fs.unlinkSync(png);
  } catch (error) {
    console.error("❌ Error during render:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("✅ BPMN Render API is running");
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
