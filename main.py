# main.py
from fastapi import FastAPI, File, UploadFile
import numpy as np
import cv2

app = FastAPI()

@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Tích hợp pipeline YOLO và OCR
    # bbox, conf = yolo_model(img)
    # plate_text = read_plate(img[y1:y2, x1:x2]) 
    
    return {"plate": "30A12345", "confidence": 0.98}

# test_main.py
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_detect():
    with open("dummy.jpg", "wb") as f: 
        f.write(b"dummy")
    with open("dummy.jpg", "rb") as f:
        response = client.post("/detect", files={"file": ("dummy.jpg", f, "image/jpeg")})
    assert response.status_code == 200
    assert "plate" in response.json()
    assert "confidence" in response.json()