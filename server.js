const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const bpmnToImage = require('bpmn-to-image');
const puppeteer = require('puppeteer');

process.env.PUPPETEER_EXECUTABLE_PATH = puppeteer.executablePath();

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/render', upload.single('bpmn'), async (req, res) => {
  try {
    const id = uuidv4();
    const outputDir = path.join(__dirname, 'output', id);
    fs.mkdirSync(outputDir, { recursive: true });

    await bpmnToImage.convert({
      input: req.file.path,
      output: outputDir,
      format: 'png'
    });

    const outputFilePath = path.join(outputDir, 'diagram.png');
    res.sendFile(outputFilePath);
  } catch (err) {
    console.error('❌ Error during render:', err);
    res.status(500).send('Error rendering BPMN diagram.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
