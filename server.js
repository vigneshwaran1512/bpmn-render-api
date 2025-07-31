const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const app = express();

app.use(express.text({ type: '*/*' }));

app.get('/', (req, res) => {
  res.send('✅ BPMN Render API is running');
});

app.post('/render', async (req, res) => {
  const bpmnXML = req.body;

  if (!bpmnXML || !bpmnXML.includes('<?xml')) {
    return res.status(400).send('Bad Request: BPMN XML missing or invalid');
  }

  const id = uuidv4();
  const tempDir = path.join(__dirname, 'temp');
  const htmlPath = path.join(tempDir, `${id}.html`);
  const svgPath = path.join(tempDir, `${id}.svg`);

  const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>BPMN Viewer</title>
    <script src="https://unpkg.com/bpmn-js@11.5.0/dist/bpmn-viewer.production.min.js"></script>
  </head>
  <body>
    <div id="canvas" style="width:1000px; height:600px; border:1px solid gray;"></div>
    <script>
      const viewer = new BpmnJS({ container: '#canvas' });
      const xml = \`${bpmnXML.replace(/`/g, '\\`')}\`;

      viewer.importXML(xml).then(() => {
        viewer.saveSVG().then(({ svg }) => {
          fetch('/svg-result', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: svg
          });
        });
      }).catch(err => {
        document.body.innerHTML = '<pre>' + err.toString() + '</pre>';
      });
    </script>
  </body>
</html>`;

  try {
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(htmlPath, htmlContent);

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    });
    const page = await browser.newPage();

    let svgContent = null;

    app.post('/svg-result', express.text({ type: '*/*' }), async (req2, res2) => {
      svgContent = req2.body;
      res2.send('SVG received');
    });

    await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });

    // Wait for SVG to be posted
    await page.waitForTimeout(3000);

    await browser.close();

    if (svgContent) {
      res.set('Content-Type', 'image/svg+xml');
      res.send(svgContent);
    } else {
      res.status(500).send('SVG not captured');
    }

    // Cleanup
    await fs.unlink(htmlPath);
  } catch (err) {
    console.error('❌ Error during render:', err);
    res.status(500).send('Internal Server Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
