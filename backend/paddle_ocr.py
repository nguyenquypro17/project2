import cv2
import re
from paddleocr import PaddleOCR
from collections import Counter

# Khởi tạo PaddleOCR
ocr = PaddleOCR(use_angle_cls=True, lang='en')


# Validate biển số (không kiểm tra regex định dạng cụ thể)
def validate_plate(text):
    # Chỉ kiểm tra chuỗi không rỗng và độ dài hợp lý
    return len(text) > 0 and len(text) <= 10

# Đọc biển số từ 1 frame ảnh đã khoanh vùng
def read_plate(image):
    result = ocr.ocr(image)
    if not result or not result[0]: 
        return ""
    text = "".join([res[1][0] for res in result[0]]).replace(" ", "").replace("-", "").replace(".", "")
    return text if validate_plate(text) else ""


# Test pipeline đầu cuối: ảnh vào -> biển số ra
def test_pipeline(image_path):
    """
    Test pipeline OCR lần lượt các bước:
    1. Đọc ảnh từ đường dẫn
    2. Tiền xử lý
    3. OCR nhận dạng
    4. Validate định dạng
    
    Args:
        image_path (str): Đường dẫn đến ảnh biển số
    
    Returns:
        dict: {
            "status": "success" hoặc "failed",
            "plate": biển số (nếu valid) hoặc "",
            "confidence": độ tin cây (%)
        }
    """
    image = cv2.imread(image_path)
    if image is None:
        return {"status": "failed", "plate": "", "error": f"Không thể đọc ảnh từ {image_path}"}
    
    result = ocr.ocr(image)
    
    if not result or not result[0]:
        return {"status": "failed", "plate": "", "confidence": 0}
    
    # Lấy text và confidence từ kết quả OCR
    text = "".join([res[1][0] for res in result[0]]).replace(" ", "").replace("-", "").replace(".", "")
    confidence = sum([res[1][1] for res in result[0]]) / len(result[0]) * 100 if result[0] else 0
    
    # Validate định dạng
    if validate_plate(text):
        return {"status": "success", "plate": text, "confidence": round(confidence, 2)}
    else:
        return {"status": "failed", "plate": text, "confidence": round(confidence, 2), "error": "Định dạng không hợp lệ"}
