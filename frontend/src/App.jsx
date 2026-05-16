import { useState, useRef } from "react";
import ImageRecognition from "./ImageRecognition";
import "./App.css";

const API_URL = "http://localhost:8000";

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)',
    color: '#e2e8f0',
  },
  gridBg: {
    position: 'fixed',
    inset: 0,
    opacity: 0.05,
    pointerEvents: 'none',
    backgroundImage: 'linear-gradient(rgba(0,255,156,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,156,0.1) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
    zIndex: 0,
  },
  content: {
    position: 'relative',
    zIndex: 10,
    maxWidth: '900px',
    margin: '0 auto',
    padding: '48px 24px',
  },
  header: {
    marginBottom: '48px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    padding: '6px 12px',
    background: 'rgba(6, 182, 212, 0.1)',
    border: '1px solid rgba(6, 182, 212, 0.3)',
    borderRadius: '6px',
    fontSize: '11px',
    color: '#06b6d4',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  badgeDot: {
    width: '6px',
    height: '6px',
    background: '#06b6d4',
    borderRadius: '50%',
  },
  title: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '8px',
    fontFamily: "'Space Mono', monospace",
  },
  titleAccent: {
    color: '#06b6d4',
  },
  subtitle: {
    fontSize: '18px',
    color: '#94a3b8',
  },
  gridLayout: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '48px',
    marginTop: '32px',
  },
  uploadSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  dropZone: {
    border: '2px dashed rgba(6, 182, 212, 0.5)',
    borderRadius: '8px',
    padding: '48px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
  },
  dropZoneHover: {
    borderColor: 'rgba(6, 182, 212, 0.8)',
    background: 'rgba(6, 182, 212, 0.05)',
  },
  uploadIcon: {
    width: '48px',
    height: '48px',
    color: '#06b6d4',
    strokeWidth: 2,
  },
  uploadText: {
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '16px',
  },
  uploadHint: {
    color: '#94a3b8',
    fontSize: '14px',
    marginTop: '4px',
  },
  button: {
    width: '100%',
    background: '#06b6d4',
    color: '#ffffff',
    fontWeight: 600,
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '16px',
    transition: 'all 0.2s',
  },
  buttonDisabled: {
    background: '#4b5563',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  previewSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  previewLabel: {
    color: '#cbd5e1',
    fontWeight: 600,
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  resultCard: {
    background: 'rgba(30, 41, 59, 0.5)',
    border: '1px solid rgba(6, 182, 212, 0.3)',
    borderRadius: '8px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  resultTitle: {
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '18px',
  },
  resultItem: {
    background: 'rgba(15, 23, 42, 0.5)',
    borderRadius: '6px',
    padding: '16px',
  },
  resultLabel: {
    color: '#94a3b8',
    fontSize: '12px',
  },
  resultValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#06b6d4',
    fontFamily: "'Space Mono', monospace",
    letterSpacing: '0.05em',
  },
  errorMessage: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.5)',
    borderRadius: '8px',
    padding: '16px',
    color: '#f87171',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  footer: {
    marginTop: '64px',
    paddingTop: '32px',
    borderTop: '1px solid rgba(59, 130, 246, 0.2)',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '14px',
  },
  '@media (max-width: 768px)': {
    gridLayout: {
      gridTemplateColumns: '1fr',
      gap: '24px',
    },
  },
};

export default function App() {
  const fileInputRef = useRef(null);
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hovering, setHovering] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn tệp ảnh hợp lệ");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
      setError(null);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!image) {
      setError("Vui lòng chọn ảnh trước");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(image);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append("file", blob, "image.jpg");

      const uploadResponse = await fetch(`${API_URL}/detect`, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Server error: ${uploadResponse.status}`);
      }

      const data = await uploadResponse.json();
      setResult(data);
    } catch (err) {
      setError(`Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.gridBg}></div>

      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.badge}>
            <span style={styles.badgeDot}></span>
            <span>License Plate Recognition</span>
          </div>
          <h1 style={styles.title}>
            Nhận Diện <span style={styles.titleAccent}>Biển Số Xe</span>
          </h1>
          <p style={styles.subtitle}>Tải ảnh lên để nhận diện và trích xuất biển số xe tự động</p>
        </div>

        <div style={styles.gridLayout}>
          <div style={styles.uploadSection}>
            <div
              style={{
                ...styles.dropZone,
                ...(hovering ? styles.dropZoneHover : {}),
              }}
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
            >
              <svg style={styles.uploadIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <div>
                <p style={styles.uploadText}>Kéo thả hoặc nhấp để tải ảnh</p>
                <p style={styles.uploadHint}>JPG, PNG hoặc GIF (tối đa 10MB)</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            <button
              onClick={handleUpload}
              disabled={!image || loading}
              style={{
                ...styles.button,
                ...((!image || loading) ? styles.buttonDisabled : {}),
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#ffffff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}></div>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Tải lên và Nhận Diện
                </>
              )}
            </button>

            {error && (
              <div style={styles.errorMessage}>
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-4a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
          </div>

          <div style={styles.previewSection}>
            {image && (
              <div>
                <h3 style={styles.previewLabel}>Xem Trước</h3>
                {result ? (
                  <ImageRecognition image={image} result={result} />
                ) : (
                  <img
                    src={image}
                    alt="Preview"
                    style={{
                      width: '100%',
                      borderRadius: '8px',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      background: '#1e293b',
                      objectFit: 'cover',
                      maxHeight: '384px',
                    }}
                  />
                )}
              </div>
            )}

            {result && (
              <div style={styles.resultCard}>
                <h3 style={styles.resultTitle}>Kết Quả Nhận Diện</h3>

                <div style={styles.resultItem}>
                  <p style={styles.resultLabel}>Biển Số</p>
                  <p style={styles.resultValue}>{result.plate || "Không phát hiện"}</p>
                </div>

                <div style={styles.resultItem}>
                  <p style={styles.resultLabel}>Độ Tin Cậy</p>
                  <p style={styles.resultValue}>{(result.confidence * 100).toFixed(2)}%</p>
                  <div style={{
                    width: '100%',
                    background: '#4b5563',
                    borderRadius: '4px',
                    height: '8px',
                    marginTop: '8px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      background: 'linear-gradient(to right, #06b6d4, #22d3ee)',
                      height: '100%',
                      width: `${Math.min(result.confidence * 100, 100)}%`,
                      transition: 'width 0.3s ease-out',
                    }}></div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setImage(null);
                    setResult(null);
                  }}
                  style={{
                    ...styles.button,
                    background: '#4b5563',
                    marginTop: '16px',
                  }}
                >
                  Xóa & Tải Lại
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={styles.footer}>
          <p>Powered by YOLO Detection + PaddleOCR</p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          ${styles.content ? `{
            padding: 24px;
          }` : ''}
        }
      `}</style>
    </div>
  );
}
  

  