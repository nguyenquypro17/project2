# main.py
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import numpy as np
import cv2
import os
from ultralytics import YOLO
from backend.paddle_ocr import read_plate
import json

app = FastAPI()

# Load YOLO model
model_path = "runs/train/train_8m/weights/best.pt"
if not os.path.exists(model_path):
    model_path = "yolov8m.pt"  # Fallback to pretrained if no custom model
try:
    yolo_model = YOLO(model_path)
except Exception as e:
    print(f"Error loading YOLO model: {e}")
    yolo_model = YOLO("yolov8m.pt")  # Dùng pretrained nếu load fail


@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    """
    API endpoint nhận upload ảnh, detect biển số bằng YOLO + OCR, trả kết quả
    Request: POST /detect với file ảnh
    Response: JSON {"plate": "...", "confidence": 0.xx}
    """
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return JSONResponse(
                status_code=400, 
                content={"error": "Invalid image format"}
            )
        
        # Bước 1: YOLO detect biển số
        results = yolo_model(img)
        
        plate_text = ""
        confidence = 0.0
        
        if results and len(results) > 0:
            result = results[0]
            if len(result.boxes) > 0:
                # Lấy bbox có confidence cao nhất
                boxes = result.boxes
                max_conf_idx = np.argmax(boxes.conf.cpu().numpy())
                bbox = boxes.xyxy[max_conf_idx].cpu().numpy()
                box_conf = boxes.conf[max_conf_idx].cpu().numpy()
                
                # Crop biển số từ ảnh
                x1, y1, x2, y2 = map(int, bbox)
                plate_crop = img[max(0, y1):min(img.shape[0], y2), 
                                 max(0, x1):min(img.shape[1], x2)]
                
                # Bước 2: OCR nhận dạng biển số
                if plate_crop.size > 0:
                    plate_text = read_plate(plate_crop)
                    confidence = float(box_conf)
        
        return {
            "plate": plate_text if plate_text else "Not detected",
            "confidence": round(confidence, 4)
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

# ============ TEST PIPELINE ============
if __name__ == "__main__":
    """
    Test pipeline đầu cuối: ảnh vào -> biển số ra
    Chạy: python main.py
    """
    import os
    from fastapi.testclient import TestClient
    
    client = TestClient(app)
    
    # Tìm ảnh test từ dataset
    test_image_paths = [
        "dataset/train1/images",
        "dataset/train2/images/train",
        "dataset/train3/images/train",
        "Large-License-Plate-Detection-Dataset/images/test"
    ]
    
    test_image = None
    for path in test_image_paths:
        if os.path.exists(path):
            images = [f for f in os.listdir(path) if f.endswith(('.jpg', '.png', '.jpeg'))]
            if images:
                test_image = os.path.join(path, images[0])
                break
    
    if test_image:
        print(f"Testing with image: {test_image}")
        with open(test_image, "rb") as f:
            response = client.post("/detect", files={"file": ("test.jpg", f, "image/jpeg")})
        
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"Result: {json.dumps(result, indent=2)}")
        
        # Validate response
        assert response.status_code == 200
        assert "plate" in result
        assert "confidence" in result
        print("✓ Test passed!")
    else:
        print("No test images found in dataset paths")