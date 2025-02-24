from ultralytics import YOLO
import joblib
import numpy as np
from flask import Flask, request, jsonify
import os
import base64
import tempfile
from flask_cors import CORS
import ssl




app = Flask(__name__)
CORS(app, resources={
    r"/predict": {
        "origins": ["https://your-github-pages-url.github.io", "http://localhost:5000"],
        "methods": ["POST", "OPTIONS"]
    }
})

trumpfmodel = joblib.load('./rf_model2.joblib')



model = YOLO('./runs/detect/train3-1/weights/best.pt')

cards_nums = {
    "Ei_6":0,
    "Ei_7":1,
    "Ei_8":2,
    "Ei_9":3,
    "Ei_10":4,
    "Ei_U":5,
    "Ei_O":6,
    "Ei_K":7,
    "Ei_A":8,
    "Ro_6":9,
    "Ro_7":10,
    "Ro_8":11,
    "Ro_9":12,
    "Ro_10":13,
    "Ro_U":14,
    "Ro_O":15,
    "Ro_K":16,
    "Ro_A":17,
    "Se_6": 18,
    "Se_7": 19,
    "Se_8": 20,
    "Se_9": 21,
    "Se_10": 22,
    "Se_U": 23,
    "Se_O": 24,
    "Se_K": 25,
    "Se_A": 26,
    "Si_6": 27,
    "Si_7": 28,
    "Si_8": 29,
    "Si_9": 30,
    "Si_10": 31,
    "Si_U": 32,
    "Si_O": 33,
    "Si_K": 34,
    "Si_A": 35,
}

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    if 'image' not in data:
        return jsonify({'error': 'no image found'})
    
    # Check if we're getting manually selected cards
    manual_cards = data.get('cards', None)
    
    if manual_cards:
        # Use the manually selected cards
        print("Using manually selected cards:", manual_cards)  # Debug log
        cards = []
        for name in manual_cards:
            card_val = cards_nums.get(name)
            if card_val is not None:
                cards.append(card_val)
            else:
                cards.append(-1)
                
        current_sample = np.array([cards])
        probabilities = trumpfmodel.predict_proba(current_sample)[0]
        
        top3 = probabilities.argsort()[-3:][::-1]
        top3_classes = [trumpfmodel.classes_[i] for i in top3]
        top3_probs = probabilities[top3]
        
        result_text = "Top 3 Trümpf: \n"
        for cls, prob in zip(top3_classes, top3_probs):
            result_text += f"{cls} ({prob:.2f})\n"
            
        return jsonify({'prediction': result_text, 'cards': manual_cards})
    
    # If no manual cards, proceed with image detection
    image_data = data['image']
    if ',' in image_data:
        image_data = image_data.split(',', 1)[1]
    try:
        image_bytes = base64.b64decode(image_data)
    except Exception as e:
        return jsonify({'error': str(e)})
    with tempfile.NamedTemporaryFile(suffix=".jpg",delete=False) as temp_file:
        temp_file.write(image_bytes)
        temp_file.flush()
        temp_filename = temp_file.name

    try:

        results = model(temp_filename, imgsz=640, conf=0.3)  # Perform inference

        boxes = results[0].boxes

        detections = boxes.data.cpu().numpy()

        best_by_class = {}
        for det in detections:
            cls = int(det[5])
            conf = det[4]
            if cls not in best_by_class or conf > best_by_class[cls][4]:
                best_by_class[cls] = det


        unique_detections = list(best_by_class.values())
        unique_detections.sort(key=lambda x: x[4], reverse=True)

        top9 = unique_detections[:9]
        recognized_cards = [model.names[int(det[5])] for det in top9]

        class_names = [model.names[int(det[5])] for det in top9]

#print(class_names)

        cards = []

        for name in class_names:
            card_val = cards_nums.get(name)
            if card_val is not None:
                cards.append(card_val)
            else:

                cards.append(-1)

        current_sample = np.array([cards])

        probabilities = trumpfmodel.predict_proba(current_sample)[0]

        top3 = probabilities.argsort()[-3:][::-1]
        top3_classes = [trumpfmodel.classes_[i] for i in top3]
        top3_probs = probabilities[top3]


        result_text = "Top 3 Trümpf: \n"
        for cls, prob in zip(top3_classes, top3_probs):
            result_text += f"{cls} ({prob:.2f})\n"

        os.remove(temp_filename)

        return jsonify({'prediction': result_text, 'cards': recognized_cards})
    except Exception as e:
        os.remove(temp_filename)
        return jsonify({'error': str(e)})

application = app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    application.run(host='0.0.0.0', port=port)
        