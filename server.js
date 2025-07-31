const express = require('express');
const bodyParser = require('body-parser');
const execa = require('execa');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '10mb' }));

app.post('/render', async (req, res) => {
  try {
    const xml = req.body.xml;
    if (!xml) {
      return res.status(400).send('Missing BPMN XML');
    }

    const id = uuidv4();
    const inputFile = path.join(__dirname, `${id}.bpmn`);
    const outputFile = path.join(__dirname, `${id}.svg`);

    fs.writeFileSync(inputFile, xml, 'utf8');

    // Convert to SVG using bpmn-to-image CLI
    await execa('npx', ['bpmn-to-image', inputFile, outputFile]);

    const svg = fs.readFileSync(outputFile, 'utf8');

    // Clean up temp files
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to render BPMN diagram');
  }
});

app.get('/', (req, res) => {
  res.send('BPMN Render API is running');
});

app.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
