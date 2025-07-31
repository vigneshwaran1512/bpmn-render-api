const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { convert } = require('bpmn-to-image');
const chrome = require('chrome-aws-lambda');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.text({ type: '*/*' }));

app.post('/render', async (req, res) => {
  try {
    const bpmnXml = req.body;
    const tempId = uuidv4();
    const bpmnFilePath = path.join(__dirname, `${tempId}.bpmn`);
    const imageFilePath = path.join(__dirname, `${tempId}.svg`);

    // Save incoming BPMN XML to file
    fs.writeFileSync(bpmnFilePath, bpmnXml, 'utf8');

    // Convert to image
    await convert({
      source: bpmnFilePath,
      destination: imageFilePath,
      format: 'svg',
      executablePath: await chrome.executablePath,
      args: chrome.args,
      headless: chrome.headless,
      defaultViewport: chrome.defaultViewport
    });

    // Send the rendered SVG
    const imageBuffer = fs.readFileSync(imageFilePath);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(imageBuffer);

    // Cleanup
    fs.unlinkSync(bpmnFilePath);
    fs.unlinkSync(imageFilePath);
  } catch (err) {
    console.error('❌ Error during render:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
