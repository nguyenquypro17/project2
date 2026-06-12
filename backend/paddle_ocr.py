import cv2
import difflib
from paddleocr import PaddleOCR

# Tắt các tính năng tự động xoay ảnh gây lỗi
ocr = PaddleOCR(
    lang='en',
    use_angle_cls=False,
    use_doc_orientation_classify=False,
    use_doc_unwarping=False
)

# Tên hãng xe thường bị OCR lẫn vào do nằm gần biển số (logo trên xe)
BRAND_NAMES = [
    "HONDA", "YAMAHA", "SUZUKI", "PIAGGIO", "VESPA", "SYM",
    "KYMCO", "KAWASAKI", "DUCATI", "VINFAST", "BAJAJ", "TRIUMPH",
]

def _is_brand_text(text):
    t = text.upper().replace(" ", "")
    # Biển số luôn có chữ số, tên hãng xe chỉ gồm chữ cái
    if not t or any(c.isdigit() for c in t):
        return False
    return any(difflib.SequenceMatcher(None, t, brand).ratio() > 0.6 for brand in BRAND_NAMES)

def read_plate(image):
    # Phóng to ảnh gấp 2 lần để nét chữ rõ hơn
    img_resized = cv2.resize(image, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    
    try:
        results = ocr.predict(img_resized)
    except Exception:
        results = ocr.ocr(img_resized)
        
    plate_text = ""
    
    if results and isinstance(results, list) and len(results) > 0:
        first_result = results[0]
        
        # Xử lý format dictionary
        if isinstance(first_result, dict):
            rec_texts = [t for t in first_result.get('rec_texts', []) if not _is_brand_text(t)]
            if rec_texts:
                plate_text = "-".join(rec_texts)

        # Xử lý format list
        elif isinstance(first_result, list):
            texts = [line[1][0] for line in first_result if isinstance(line, list) and len(line) == 2 and isinstance(line[1], tuple)]
            texts = [t for t in texts if not _is_brand_text(t)]
            plate_text = "-".join(texts)
            
    # Xóa khoảng trắng thừa
    return plate_text.replace(" ", "")