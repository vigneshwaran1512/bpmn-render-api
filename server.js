const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { convert } = require('bpmn-to-image');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.text({ type: 'application/xml' }));

app.post('/render', async (req, res) => {
  try {
    const bpmnXml = req.body;
    const tempId = uuidv4();
    const bpmnFilePath = path.join(__dirname, `${tempId}.bpmn`);
    const imageFilePath = path.join(__dirname, `${tempId}.svg`);

    fs.writeFileSync(bpmnFilePath, bpmnXml, 'utf8');

    await convert({
      source: bpmnFilePath,
      destination: imageFilePath,
      format: 'svg' // or 'png'
    });

    const imageBuffer = fs.readFileSync(imageFilePath);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(imageBuffer);

    // Clean up files
    fs.unlinkSync(bpmnFilePath);
    fs.unlinkSync(imageFilePath);
  } catch (err) {
    console.error('❌ Error during render:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
