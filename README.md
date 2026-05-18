# License Plate Detection & OCR Project

Dự án nhận diện và trích xuất thông tin từ biển số xe sử dụng YOLOv8 và PaddleOCR.

## 📋 Tổng quan dự án

Ứng dụng web full-stack cho phép người dùng:
- Tải lên hình ảnh chứa biển số xe
- Phát hiện biển số trong ảnh bằng mô hình YOLOv8
- Trích xuất và nhận diện văn bản từ biển số (OCR) bằng PaddleOCR
- Hiển thị kết quả trên giao diện web thân thiện

### Công nghệ sử dụng
- **Backend**: FastAPI (Python)
- **Frontend**: React + Vite + Tailwind CSS
- **ML Models**: 
  - YOLOv8 (phát hiện biển số)
  - PaddleOCR (nhận diện ký tự)

---

## 🛠️ Yêu cầu hệ thống

### Yêu cầu chung
- Python 3.8+
- Node.js 16+ và npm/yarn
- pip (Python package manager)

### Kiểm tra phiên bản
```bash
python --version
node --version
npm --version
```

---

## 📦 Cài đặt

### 1️⃣ Clone hoặc tải về dự án
```bash
git clone https://github.com/nguyenquypro17/project2.git
```

### 2️⃣ Cài đặt Backend

#### Bước 1: Tạo Virtual Environment (khuyến nghị)
```bash
# Trên macOS/Linux
python3 -m venv venv
source venv/bin/activate

# Trên Windows
python -m venv venv
venv\Scripts\activate
```

#### Bước 2: Cài đặt Dependencies
```bash
# Cài đặt các thư viện cần thiết
pip install fastapi
pip install uvicorn
pip install python-multipart
pip install opencv-python
pip install numpy
pip install ultralytics
pip install paddleocr paddlepaddle
pip install pillow
```

Hoặc cài đặt từ file requirements.txt (nếu có):
```bash
pip install -r requirements.txt
```

#### Bước 3: Chuẩn bị Model
- Mô hình `yolov8m.pt` hoặc `best.pt` (fine-tuned) cần nằm trong thư mục dự án
- Nếu dùng model tùy chỉnh, cập nhật đường dẫn trong `backend/main.py` dòng:
  ```python
  model_path = "đường/dẫn/đến/best.pt"
  ```

### 3️⃣ Cài đặt Frontend

#### Bước 1: Di chuyển vào thư mục frontend
```bash
cd frontend
```

#### Bước 2: Cài đặt Dependencies
```bash
npm install
```

---

## 🚀 Chạy dự án

### Chạy cùng lúc (khuyến nghị)

**Terminal 1 - Backend:**
```bash
# Từ thư mục gốc của dự án
source venv/bin/activate  # (nếu dùng Virtual Environment)
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Truy cập ứng dụng
- **Frontend**: http://localhost:5173 (mặc định Vite)
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (Swagger UI)

---

## 📂 Cấu trúc dự án

```
project 2/
├── backend/
│   ├── main.py              # FastAPI server chính
│   ├── paddle_ocr.py        # Module OCR
│   └── __pycache__/
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Component chính
│   │   ├── ImageRecognition.jsx
│   │   ├── main.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── assets/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── model/
│   ├── finetune_yolov8.py   # Script fine-tune mô hình
│   └── preprocess.ipynb     # Tiền xử lý dữ liệu
├── train_8m-2/              # Kết quả training
│   └── weights/
│       ├── best.pt          # Mô hình tốt nhất
│       └── last.pt
├── test_model.ipynb         # Notebook kiểm tra mô hình
└── yolov8m.pt              # Mô hình YOLOv8 pretrained
```

---

## 🔌 API Endpoints

### POST /detect
Tải lên ảnh để phát hiện và nhận diện biển số

**Request:**
```bash
curl -X POST "http://localhost:8000/detect" \
  -F "file=@path/to/image.jpg"
```

**Response:**
```json
{
  "plate_text": "29X-123.45",
  "confidence": 0.95,
  "box_coords": [[x1, y1], [x2, y2]],
  "status": "success"
}
```

---

## ⚙️ Cấu hình

### Thay đổi port Backend
Trong `backend/main.py`, mở terminal và chạy:
```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port YOUR_PORT
```

### Thay đổi port Frontend
Trong `frontend/vite.config.js`, thêm:
```javascript
export default {
  server: {
    port: YOUR_PORT
  }
}
```

---

## 🧪 Kiểm tra mô hình

### Sử dụng Jupyter Notebook
```bash
jupyter notebook test_model.ipynb
```

### Fine-tune mô hình (nếu cần)
```bash
cd model
jupyter notebook finetune_yolov8.py
```

---

## 📝 Troubleshooting

### Lỗi import module
```bash
# Đảm bảo file __init__.py tồn tại
touch backend/__init__.py
```

### Lỗi không tìm thấy mô hình
- Kiểm tra đường dẫn model trong `backend/main.py`
- Đảm bảo file `.pt` đã download/tạo

### CORS Error
- Kiểm tra cấu hình CORS trong `backend/main.py` dòng:
  ```python
  allow_origins=["*"]  # Cho phép tất cả domain
  ```

### Port đang sử dụng
```bash
# Thay đổi port hoặc kill process
lsof -i :8000  # Kiểm tra process
kill -9 PID    # Dừng process
```

---

## 📚 Tài liệu tham khảo

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [YOLOv8 Documentation](https://docs.ultralytics.com/)
- [PaddleOCR GitHub](https://github.com/PaddlePaddle/PaddleOCR)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

---

## 👨‍💻 Liên hệ & Hỗ trợ

Nếu gặp vấn đề, vui lòng kiểm tra lại các bước cài đặt hoặc tham khảo tài liệu của các thư viện sử dụng.

---

**Version**: 1.0  
**Last Updated**: May 2026
