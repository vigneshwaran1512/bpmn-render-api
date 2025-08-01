const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: "10mb" }));

app.post("/render", async (req, res) => {
  const { bpmnXml } = req.body;

  if (!bpmnXml) {
    return res.status(400).send("Missing bpmnXml in request body");
  }

  try {
    const browser = await puppeteer.launch({
      executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Serve the HTML page that renders BPMN
    const html = fs.readFileSync(path.join(__dirname, "viewer.html"), "utf8");
    await page.setContent(html);

    // Set BPMN diagram XML
    await page.evaluate((xml) => {
      window.renderBPMN(xml);
    }, bpmnXml);

    // Wait for rendering
    await page.waitForSelector("svg");

    // Extract SVG
    const svg = await page.$eval("svg", (el) => el.outerHTML);
    await browser.close();

    res.set("Content-Type", "image/svg+xml");
    res.send(svg);
  } catch (err) {
    console.error("Error rendering BPMN:", err);
    res.status(500).send("Rendering failed");
  }
});

app.get("/", (req, res) => {
  res.send("BPMN Render API is running.");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
