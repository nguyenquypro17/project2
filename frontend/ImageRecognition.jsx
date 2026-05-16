import { useState, useRef, useCallback } from "react";

const ACCENT = "#00FF9C";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body { background: #080A0F; }

  .root {
    font-family: 'Space Mono', monospace;
    background: #080A0F;
    min-height: 100vh;
    color: #E0E6F0;
    position: relative;
    overflow-x: hidden;
  }

  .grid-bg {
    position: fixed; inset: 0; z-index: 0;
    background-image:
      linear-gradient(rgba(0,255,156,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,255,156,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }

  .noise {
    position: fixed; inset: 0; z-index: 1; pointer-events: none; opacity: 0.04;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  }

  .container {
    position: relative; z-index: 2;
    max-width: 900px; margin: 0 auto;
    padding: 40px 24px;
  }

  .header { margin-bottom: 40px; }

  .badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(0,255,156,0.08); border: 1px solid rgba(0,255,156,0.25);
    padding: 4px 12px; border-radius: 2px;
    font-size: 10px; letter-spacing: 0.15em; color: #00FF9C;
    margin-bottom: 16px;
    text-transform: uppercase;
  }

  .dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #00FF9C;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.8); }
  }

  .title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(28px, 5vw, 48px);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.02em;
    color: #fff;
  }

  .title span { color: #00FF9C; }

  .subtitle {
    margin-top: 8px;
    font-size: 12px;
    color: rgba(224,230,240,0.45);
    letter-spacing: 0.05em;
  }

  .main-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    align-items: start;
  }

  @media (max-width: 640px) {
    .main-grid { grid-template-columns: 1fr; }
  }

  .panel {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 4px;
    overflow: hidden;
  }

  .panel-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
    color: rgba(224,230,240,0.5);
  }

  .panel-header .tag {
    font-size: 9px; padding: 2px 8px;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 2px; color: rgba(224,230,240,0.35);
  }

  .drop-zone {
    position: relative;
    min-height: 260px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 12px;
    padding: 24px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .drop-zone:hover, .drop-zone.drag-over {
    background: rgba(0,255,156,0.04);
  }

  .drop-zone.drag-over {
    border-color: rgba(0,255,156,0.5);
  }

  .drop-icon {
    width: 48px; height: 48px;
    border: 1px solid rgba(0,255,156,0.3);
    border-radius: 3px;
    display: flex; align-items: center; justify-content: center;
    color: #00FF9C;
    font-size: 20px;
    background: rgba(0,255,156,0.05);
    transition: all 0.2s;
  }

  .drop-zone:hover .drop-icon {
    background: rgba(0,255,156,0.1);
    border-color: rgba(0,255,156,0.6);
  }

  .drop-label {
    font-size: 12px; color: rgba(224,230,240,0.5);
    text-align: center; line-height: 1.6;
  }

  .drop-label strong { color: #00FF9C; display: block; font-size: 13px; }

  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 20px;
    background: #00FF9C; color: #080A0F;
    font-family: 'Space Mono', monospace;
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    border: none; border-radius: 2px; cursor: pointer;
    transition: all 0.15s;
  }

  .btn:hover { background: #00e88c; transform: translateY(-1px); }
  .btn:active { transform: translateY(0); }

  .btn:disabled {
    background: rgba(0,255,156,0.2); color: rgba(0,255,156,0.4);
    cursor: not-allowed; transform: none;
  }

  .preview-img {
    width: 100%; height: 260px;
    object-fit: contain;
    background: rgba(0,0,0,0.3);
    display: block;
  }

  .img-meta {
    padding: 10px 16px;
    font-size: 10px; color: rgba(224,230,240,0.35);
    border-top: 1px solid rgba(255,255,255,0.05);
    display: flex; justify-content: space-between;
    letter-spacing: 0.05em;
  }

  .result-body { padding: 16px; min-height: 260px; }

  .result-empty {
    height: 200px;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column; gap: 8px;
    color: rgba(224,230,240,0.2);
    font-size: 11px; letter-spacing: 0.08em; text-align: center;
  }

  .result-text {
    font-size: 13px; line-height: 1.7;
    color: rgba(224,230,240,0.85);
    white-space: pre-wrap;
  }

  .spinner {
    width: 32px; height: 32px;
    border: 2px solid rgba(0,255,156,0.15);
    border-top-color: #00FF9C;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .loading-label {
    font-size: 11px; color: rgba(0,255,156,0.6);
    letter-spacing: 0.1em; text-transform: uppercase;
    text-align: center; margin-top: 12px;
  }

  .tags-wrap {
    display: flex; flex-wrap: wrap; gap: 6px;
    margin-top: 14px; padding-top: 14px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }

  .result-tag {
    font-size: 10px; padding: 3px 10px;
    border: 1px solid rgba(0,255,156,0.2);
    border-radius: 2px; color: #00FF9C;
    background: rgba(0,255,156,0.05);
    letter-spacing: 0.06em;
  }

  .analyze-row {
    padding: 12px 16px;
    border-top: 1px solid rgba(255,255,255,0.06);
    display: flex; justify-content: flex-end; gap: 8px;
  }

  .btn-outline {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 14px;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.12);
    color: rgba(224,230,240,0.5);
    font-family: 'Space Mono', monospace;
    font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
    border-radius: 2px; cursor: pointer;
    transition: all 0.15s;
  }

  .btn-outline:hover {
    border-color: rgba(255,255,255,0.25);
    color: rgba(224,230,240,0.8);
  }

  .error-msg {
    background: rgba(255,60,60,0.08);
    border: 1px solid rgba(255,60,60,0.2);
    color: #ff6b6b; border-radius: 3px;
    padding: 10px 14px; font-size: 11px;
    margin-top: 12px; line-height: 1.5;
  }

  .confidence-bar {
    margin-top: 14px; padding-top: 14px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }

  .conf-label {
    font-size: 10px; letter-spacing: 0.08em;
    text-transform: uppercase; color: rgba(224,230,240,0.3);
    margin-bottom: 8px;
  }

  .bar-track {
    height: 3px; background: rgba(255,255,255,0.06);
    border-radius: 2px; overflow: hidden;
  }

  .bar-fill {
    height: 100%; background: linear-gradient(90deg, #00FF9C, #00ccff);
    border-radius: 2px;
    transition: width 1s cubic-bezier(0.4,0,0.2,1);
  }
`;

export default function ImageRecognition() {
  const [image, setImage] = useState(null); // { url, file, name, size }
  const [result, setResult] = useState(null);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const loadFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setImage({ url, file, name: file.name, size: (file.size / 1024).toFixed(1) + " KB" });
    setResult(null); setTags([]); setError(null);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    loadFile(file);
  }, [loadFile]);

  const analyze = async () => {
    if (!image) return;
    setLoading(true); setResult(null); setTags([]); setError(null);

    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = () => rej(new Error("Đọc file thất bại"));
        r.readAsDataURL(image.file);
      });

      const mt = image.file.type || "image/jpeg";

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are an image recognition AI. Analyze the image and return ONLY a JSON object (no markdown, no preamble) with:
{
  "description": "1-2 sentence description in Vietnamese",
  "objects": ["array", "of", "detected", "objects", "in", "Vietnamese"],
  "scene": "scene type in Vietnamese (1-3 words)",
  "confidence": 0.XX
}`,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mt, data: base64 } },
              { type: "text", text: "Phân tích ảnh này." }
            ]
          }]
        })
      });

      const data = await response.json();
      const text = data.content?.map(c => c.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();

      let parsed;
      try { parsed = JSON.parse(clean); } catch { parsed = null; }

      if (parsed) {
        setResult(parsed.description || text);
        setTags([parsed.scene, ...(parsed.objects || [])].filter(Boolean).slice(0, 8));
        window._confidence = parsed.confidence || 0.88;
      } else {
        setResult(text);
        window._confidence = 0.8;
      }
    } catch (err) {
      setError(err.message || "Phân tích thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null); setResult(null); setTags([]); setError(null);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="root">
        <div className="grid-bg" />
        <div className="noise" />
        <div className="container">
          <div className="header">
            <div className="badge"><span className="dot" />Vision AI · Active</div>
            <h1 className="title">Image<br /><span>Recognition</span></h1>
            <p className="subtitle">// Upload → Analyze → Decode</p>
          </div>

          <div className="main-grid">
            {/* LEFT: Upload */}
            <div className="panel">
              <div className="panel-header">
                <span>Input</span>
                <span className="tag">IMG</span>
              </div>

              {!image ? (
                <div
                  className={`drop-zone${dragOver ? " drag-over" : ""}`}
                  onClick={() => fileRef.current.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => loadFile(e.target.files[0])}
                  />
                  <div className="drop-icon">↑</div>
                  <div className="drop-label">
                    <strong>Kéo & thả ảnh vào đây</strong>
                    hoặc click để chọn file<br />
                    <span style={{ fontSize: "10px", opacity: 0.6 }}>PNG, JPG, WEBP · Tối đa 10MB</span>
                  </div>
                </div>
              ) : (
                <>
                  <img src={image.url} alt="preview" className="preview-img" />
                  <div className="img-meta">
                    <span>{image.name}</span>
                    <span>{image.size}</span>
                  </div>
                </>
              )}

              <div className="analyze-row">
                {image && (
                  <button className="btn-outline" onClick={reset}>✕ Reset</button>
                )}
                <button className="btn" onClick={analyze} disabled={!image || loading}>
                  {loading ? "Analyzing..." : "▶ Analyze"}
                </button>
              </div>
            </div>

            {/* RIGHT: Result */}
            <div className="panel">
              <div className="panel-header">
                <span>Output</span>
                <span className="tag">
                  {loading ? "PROCESSING" : result ? "DONE" : "IDLE"}
                </span>
              </div>

              <div className="result-body">
                {loading && (
                  <div style={{ paddingTop: 60 }}>
                    <div className="spinner" />
                    <p className="loading-label">Đang phân tích...</p>
                  </div>
                )}

                {!loading && !result && !error && (
                  <div className="result-empty">
                    <span style={{ fontSize: 28, opacity: 0.2 }}>◈</span>
                    <span>Chưa có kết quả<br />Upload & analyze ảnh để bắt đầu</span>
                  </div>
                )}

                {error && <div className="error-msg">⚠ {error}</div>}

                {result && !loading && (
                  <>
                    <p className="result-text">{result}</p>

                    {tags.length > 0 && (
                      <div className="tags-wrap">
                        {tags.map((t, i) => (
                          <span key={i} className="result-tag">{t}</span>
                        ))}
                      </div>
                    )}

                    <div className="confidence-bar">
                      <p className="conf-label">Confidence</p>
                      <div className="bar-track">
                        <ConfBar />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ConfBar() {
  const [width, setWidth] = useState(0);
  useState(() => {
    setTimeout(() => setWidth(((window._confidence || 0.88) * 100).toFixed(0)), 100);
  });
  return <div className="bar-fill" style={{ width: width + "%" }} />;
}
