const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const app = express();

// Serve static files from the current directory
app.use(express.static(__dirname));

// Increase the JSON body limit if needed (for larger images)
app.use(express.json({ limit: '10mb' }));

// Add root route to serve landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'landing.html'));
});

app.post('/predict', (req, res) => {
  const imageData = req.body.image;
  // Remove the data URL prefix to get pure base64 data.
  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Save the image to a temporary file.
  const tempImagePath = path.join(__dirname, 'temp.jpg');
  fs.writeFile(tempImagePath, buffer, (err) => {
    if (err) {
      console.error('Error saving image:', err);
      return res.status(500).json({ error: 'Error saving image file' });
    }

    // Spawn the Python process to run your model.
    const pythonProcess = spawn('python', ['/Users/lucbaumeler/Documents/Eth/MLS/JassGott/Site/ImgToTrumpf.py', tempImagePath]);

    let output = '';
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    pythonProcess.stderr.on('data', (data) => {
      console.error('Python error:', data.toString());
    });
    pythonProcess.on('close', (code) => {
      // Delete the temporary file.
      fs.unlink(tempImagePath, () => {});
      
      if (code === 0) {
        try {
          const result = JSON.parse(output.trim());
          // Check if we have exactly 9 cards
          if (!result.cards || result.cards.length !== 9) {
            return res.status(400).json({ 
              error: 'Could not recognize 9 cards',
              cards: result.cards || [] // Send back any cards that were recognized
            });
          }
          res.json(result);
        } catch (e) {
          res.status(500).json({ error: 'Error parsing model output' });
        }
      } else {
        res.status(500).json({ error: 'Error processing image in Python script' });
      }
    });
  });
});

// SSL certificate options
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

const PORT = process.env.PORT || 3000;
https.createServer(options, app).listen(PORT, () => {
  console.log(`Secure server running on port ${PORT}`);
});