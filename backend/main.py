from fastapi import FastAPI, File, UploadFile, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import cv2
import os
from ultralytics import YOLO
from backend.paddle_ocr import read_plate
from backend.database import checkin, checkout, get_active, get_records, get_stats
app = FastAPI(title="Parking Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── YOLO model ──────────────────────────────────────────────────────────────
model_path = "/Users/ducquynguyen/Desktop/tài liệu đại học(landscape+long edge)/kì 2 năm 3/project 2/model/best_final.pt"
if not os.path.exists(model_path):
    model_path = "yolov8m.pt"
try:
    yolo_model = YOLO(model_path)
except Exception as e:
    print(f"Error loading YOLO model: {e}")
    yolo_model = YOLO("yolov8m.pt")


# ── Detection ────────────────────────────────────────────────────────────────
@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return JSONResponse(status_code=400, content={"error": "Invalid image format"})

        results = yolo_model(img)

        plate_text = ""
        confidence = 0.0
        box_coords = []

        if results and len(results) > 0:
            result = results[0]
            if len(result.boxes) > 0:
                boxes = result.boxes
                max_conf_idx = np.argmax(boxes.conf.cpu().numpy())
                bbox = boxes.xyxy[max_conf_idx].cpu().numpy()
                box_conf = boxes.conf[max_conf_idx].cpu().numpy()

                x1, y1, x2, y2 = map(int, bbox)
                box_coords = [x1, y1, x2, y2]

                plate_crop = img[max(0, y1):min(img.shape[0], y2),
                                 max(0, x1):min(img.shape[1], x2)]

                if plate_crop.size > 0:
                    plate_text = read_plate(plate_crop)
                    confidence = float(box_conf)

        return {
            "plate": plate_text if plate_text else "Not detected",
            "confidence": round(confidence, 4),
            "box": box_coords,
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})


# ── Parking management ───────────────────────────────────────────────────────
class CheckinRequest(BaseModel):
    plate: str
    vehicle_type: str = "motorbike"  # "motorbike" | "car"


class CheckoutRequest(BaseModel):
    plate: str


@app.post("/checkin")
async def api_checkin(body: CheckinRequest):
    result = checkin(body.plate, body.vehicle_type)
    return JSONResponse(status_code=200 if result["success"] else 409, content=result)


@app.post("/checkout")
async def api_checkout(body: CheckoutRequest):
    result = checkout(body.plate)
    return JSONResponse(status_code=200 if result["success"] else 404, content=result)


@app.get("/active")
async def api_active():
    return get_active()


@app.get("/records")
async def api_records(
    limit: int = Query(200, ge=1, le=1000),
    status: str = Query(""),
    date: str = Query(""),
    plate: str = Query(""),
):
    return get_records(limit=limit, status=status, date_str=date, plate=plate)


@app.get("/stats")
async def api_stats(date: str = Query("")):
    return get_stats(date_str=date)
