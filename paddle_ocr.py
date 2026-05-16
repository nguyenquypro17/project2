import cv2
import re
from paddleocr import PaddleOCR
from collections import Counter

# 1. Khởi tạo PaddleOCR
ocr = PaddleOCR(use_angle_cls=True, lang='en')

# 2. Tiền xử lý ảnh trước OCR (CLAHE)
def preprocess_image(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(gray)

# 4. Validate định dạng biển số VN bằng Regex
def validate_plate(text):
    pattern = r'^\d{2}[A-Z]\d{4,5}$'
    return bool(re.match(pattern, text))

# Đọc biển số từ 1 frame ảnh đã khoanh vùng
def read_plate(image):
    processed_img = preprocess_image(image)
    result = ocr.ocr(processed_img, cls=True)
    if not result or not result[0]: 
        return ""
    text = "".join([res[1][0] for res in result[0]]).replace(" ", "").replace("-", "").replace(".", "")
    return text if validate_plate(text) else ""

# 3. Multi-frame voting (đầu vào là list 5 ảnh crop liên tiếp)
def multi_frame_voting(frames):
    results = [read_plate(f) for f in frames]
    valid_results = [res for res in results if res]
    if not valid_results: 
        return None
    return Counter(valid_results).most_common(1)[0][0]