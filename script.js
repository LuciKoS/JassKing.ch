// Get references to HTML elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureButton = document.getElementById('capture');
const outputDiv = document.getElementById('output');

let stream = null;

// Function to start camera
async function startCamera() {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    const constraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    };

    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;
      video.style.display = 'block';
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(function(error) {
          console.error("Error playing video: " + error);
        });
      }
    } catch (err) {
      console.error("Error accessing camera: " + err);
      alert("Could not access the camera. Make sure you have given permission.");
    }
  } else {
    alert("Camera API not supported by your browser.");
  }
}

// Function to stop camera
function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    video.style.display = 'none';
    video.srcObject = null;
  }
}

const cardImageMap = {
  "Ei_6": "images3/img_0.jpg",
  "Ei_7": "images3/img_1.jpg",
  "Ei_8": "images3/img_2.jpg",
  "Ei_9": "images3/img_3.jpg",
  "Ei_10": "images3/img_4.jpg",
  "Ei_U": "images3/img_5.jpg",
  "Ei_O": "images3/img_6.jpg",
  "Ei_K": "images3/img_7.jpg",
  "Ei_A": "images3/img_8.jpg",
  "Ro_6": "images3/img_9.jpg",
  "Ro_7": "images3/img_10.jpg",
  "Ro_8": "images3/img_11.jpg",
  "Ro_9": "images3/img_12.jpg",
  "Ro_10": "images3/img_13.jpg",
  "Ro_U": "images3/img_14.jpg",
  "Ro_O": "images3/img_15.jpg",
  "Ro_K": "images3/img_16.jpg",
  "Ro_A": "images3/img_17.jpg",
  "Se_6": "images3/img_18.jpg",
  "Se_7": "images3/img_19.jpg",
  "Se_8": "images3/img_20.jpg",
  "Se_9": "images3/img_21.jpg",
  "Se_10": "images3/img_22.jpg",
  "Se_U": "images3/img_23.jpg",
  "Se_O": "images3/img_24.jpg",
  "Se_K": "images3/img_25.jpg",
  "Se_A": "images3/img_26.jpg",
  "Si_6": "images3/img_27.jpg",
  "Si_7": "images3/img_28.jpg",
  "Si_8": "images3/img_29.jpg",
  "Si_9": "images3/img_30.jpg",
  "Si_10": "images3/img_31.jpg",
  "Si_U": "images3/img_32.jpg",
  "Si_O": "images3/img_33.jpg",
  "Si_K": "images3/img_34.jpg",
  "Si_A": "images3/img_35.jpg"
}

// This is a placeholder for your model's inference function.
// Replace it with code to load and run your model (e.g., using TensorFlow.js).
async function runModelRecognize(imageElement) {
  const imageData = canvas.toDataURL('image/jpeg');

  try {
    console.log('Attempting to connect to Flask server...');
    // Try the IP address first, then localhost if that fails
    let response;
    try {
      response = await fetch('https://192.168.1.19:5001/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      });
    } catch (e) {
      console.log('Trying localhost...');
      response = await fetch('https://localhost:5001/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      });
    }
    
    console.log('Got response from server:', response.status);
    const result = await response.json();
    console.log('Parsed result:', result);
    return result;
  } catch (error) {
    console.error('Detailed error:', error);
    return { error: 'Could not connect to server. Make sure you are on the same network.' };
  }
}

// Add a function to create a card selection modal
function createCardSelectionModal(currentCard, cardPosition) {
  const modal = document.createElement('div');
  modal.className = 'card-selection-modal';
  
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  
  // Add a close button
  const closeButton = document.createElement('span');
  closeButton.className = 'close-modal';
  closeButton.innerHTML = '&times;';
  closeButton.onclick = () => modal.remove();
  
  modalContent.appendChild(closeButton);
  
  // Create grid of all possible cards
  Object.entries(cardImageMap).forEach(([cardName, imagePath]) => {
    const cardOption = document.createElement('img');
    cardOption.src = imagePath;
    cardOption.className = 'card-option';
    cardOption.onclick = async () => {
      // Check if card is already selected
      const currentCards = Array.from(document.querySelectorAll('.card-image')).map(img => img.alt);
      if (currentCards.includes(cardName) && cardName !== currentCards[cardPosition]) {
        alert('Diese Karte wurde bereits ausgewählt!');
        return;
      }
      
      // Replace the card in the display
      const cardElements = document.querySelectorAll('.card-image');
      cardElements[cardPosition].src = imagePath;
      cardElements[cardPosition].alt = cardName;
      
      modal.remove();
    };
    modalContent.appendChild(cardOption);
  });
  
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
}

// When the capture button is clicked
captureButton.addEventListener('click', async () => {
  try {
    console.log('Capture button clicked');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/jpeg');
    console.log('Image captured and converted to data URL');

    try {
      console.log('Sending request to:', 'https://jassgott-1e2a879af8c1.herokuapp.com/predict');
      const response = await fetch('https://jassgott-1e2a879af8c1.herokuapp.com/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          image: imageData
        }),
      });
      
      console.log('Response received:', response);
      const result = await response.json();
      console.log('Parsed result:', result);

      if (result.error) {
        console.error('Server returned error:', result.error);
        outputDiv.innerHTML = `
          <div id="prediction-section" style="background-color: #ffebee;">
            <div id="prediction-text" style="color: #c62828; padding: 20px;">
              Nöd 9 Charte detected
            </div>
          </div>
        `;
      } else {
        // Create separate sections for prediction and cards
        let predictionHtml = `<div id="prediction-text">${result.prediction.replace(/\n/g, "<br>")}</div>`;
        
        let cardsHtml = '';
        if (result.cards && result.cards.length > 0) {
          cardsHtml += "<div class='cards-display'>";
          result.cards.forEach(card => {
            const imgPath = cardImageMap[card]; 
            cardsHtml += `<img src="${imgPath}" alt="${card}" class="card-image"/>`;
          });
          cardsHtml += "</div>";
        }
        
        outputDiv.innerHTML = predictionHtml + cardsHtml;
      }
    } catch (error) {
      console.error('Detailed error:', error);
      outputDiv.innerHTML = `
        <div id="prediction-section" style="background-color: #ffebee;">
          <div id="prediction-text" style="color: #c62828; padding: 20px;">
            Error: ${error.message}
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Capture error:', error);
  }
});

// Initialize button text
captureButton.textContent = 'Mach es Bild';

// Hide video initially
video.style.display = 'none';