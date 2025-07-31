const express = require("express");
const bodyParser = require("body-parser");
const chromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");

const app = express();
app.use(bodyParser.text({ type: "*/*" }));

app.post("/render", async (req, res) => {
  const bpmnXml = req.body;

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless
    });

    const page = await browser.newPage();

    await page.setContent(`
      <html>
        <body>
          <div id="canvas"></div>
          <script src="https://unpkg.com/bpmn-js@11.5.0/dist/bpmn-viewer.development.js"></script>
          <script>
            const viewer = new BpmnJS({ container: '#canvas' });
            viewer.importXML(\`${bpmnXml.replace(/`/g, "\\`")}\`).then(() => {
              viewer.saveSVG().then(({ svg }) => {
                window.svgOutput = svg;
              });
            });
          </script>
        </body>
      </html>
    `);

    await page.waitForFunction(() => window.svgOutput !== undefined, { timeout: 5000 });
    const svg = await page.evaluate(() => window.svgOutput);

    await browser.close();
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(svg);
  } catch (err) {
    console.error("❌ Error during render:", err);
    res.status(500).send("Rendering failed");
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server is running...");
});
