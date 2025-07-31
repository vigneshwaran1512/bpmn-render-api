const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// 👇 Force puppeteer path
process.env.PUPPETEER_EXECUTABLE_PATH = require('puppeteer').executablePath();

const bpmnToImage = require('bpmn-to-image');

const app = express();
const upload = multer({ dest: 'uploads/' });

const PORT = process.env.PORT || 10000;

app.post('/render', upload.single('file'), async (req, res) => {
  try {
    const inputPath = req.file.path;
    const outputDir = path.join(__dirname, 'output', uuidv4());

    fs.mkdirSync(outputDir, { recursive: true });

    await bpmnToImage.convert({
      input: inputPath,
      output: outputDir,
      format: 'png'
    });

    const files = fs.readdirSync(outputDir);
    const pngFile = files.find(file => file.endsWith('.png'));

    if (!pngFile) throw new Error('PNG not generated');

    const filePath = path.join(outputDir, pngFile);
    res.sendFile(filePath);
  } catch (error) {
    console.error('❌ Error during render:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
