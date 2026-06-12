import { useState, useRef, useEffect, useCallback } from "react";
import ImageRecognition from "./ImageRecognition";
import "./App.css";

const API = "http://localhost:8000";

const VT_LABEL = { motorbike: "Xe máy", car: "Ô tô" };
const VT_ICON  = { motorbike: "🏍", car: "🚗" };

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "—";

const fmtMoney = (n) =>
  Number(n || 0).toLocaleString("vi-VN") + " đ";

const fmtDuration = (min) => {
  if (min == null) return "—";
  const h = Math.floor(min / 60), m = min % 60;
  return h > 0 ? `${h}g ${m}p` : `${m} phút`;
};

// Biển số xe máy được OCR thành 2 dòng (vd "77-H1-214.38" -> "77-H1" / "214.38")
const plateLines = (plate) => {
  if (!plate) return [plate];
  const parts = plate.split("-");
  return parts.length >= 3 ? [parts.slice(0, 2).join("-"), parts.slice(2).join("-")] : [plate];
};

// ─── Shared style tokens ────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(160deg,#080f1e 0%,#0d1a33 55%,#080f1e 100%)",
    fontFamily: "'Inter','Segoe UI',system-ui,-apple-system,sans-serif",
    color: "#e2e8f0",
  },
  card: {
    background: "rgba(13,26,51,0.7)",
    border: "1px solid rgba(59,130,246,0.18)",
    borderRadius: 12,
    backdropFilter: "blur(8px)",
  },
  label: {
    fontSize: 11, fontWeight: 700, color: "#64748b",
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6,
  },
  badge: (color) => ({
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
    background: `rgba(${color},0.12)`, border: `1px solid rgba(${color},0.35)`,
    color: `rgb(${color})`,
  }),
  th: {
    padding: "10px 14px", fontSize: 11, fontWeight: 700,
    color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6,
    textAlign: "left", borderBottom: "1px solid rgba(59,130,246,0.1)",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "11px 14px", fontSize: 13, color: "#cbd5e1",
    borderBottom: "1px solid rgba(30,50,90,0.5)",
    verticalAlign: "middle",
  },
};

// ─── Reusable components ────────────────────────────────────────────────────
function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{
      display: "flex", gap: 4, padding: "4px",
      background: "rgba(8,15,30,0.6)", borderRadius: 10,
      border: "1px solid rgba(59,130,246,0.15)",
    }}>
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          flex: 1, padding: "9px 16px", borderRadius: 7, border: "none",
          background: active === t.id
            ? "linear-gradient(135deg,#1d4ed8,#2563eb)"
            : "transparent",
          color: active === t.id ? "#fff" : "#64748b",
          fontSize: 13, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          transition: "all 0.18s",
          boxShadow: active === t.id ? "0 2px 10px rgba(37,99,235,0.35)" : "none",
          fontFamily: "inherit",
        }}>
          <span>{t.icon}</span>
          <span>{t.label}</span>
          {t.badge != null && (
            <span style={{
              minWidth: 18, height: 18, borderRadius: 9, padding: "0 5px",
              background: active === t.id ? "rgba(255,255,255,0.2)" : "rgba(59,130,246,0.2)",
              color: active === t.id ? "#fff" : "#3b82f6",
              fontSize: 11, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{t.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
      <div style={{ width: 3, height: 16, borderRadius: 2, background: "#3b82f6" }} />
      <p style={S.label}>{children}</p>
    </div>
  );
}

function StatCard({ label, value, sub, color = "59,130,246" }) {
  return (
    <div style={{
      ...S.card, padding: "18px 20px",
      borderTop: `2px solid rgb(${color})`,
    }}>
      <p style={S.label}>{label}</p>
      <p style={{
        fontSize: 22, fontWeight: 800, color: `rgb(${color})`,
        margin: "4px 0 2px", fontFamily: "'Courier New',monospace",
      }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: "#475569" }}>{sub}</p>}
    </div>
  );
}

function ConfirmModal({ data, onClose }) {
  const isOut = "fee" in data;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        ...S.card, padding: 32, maxWidth: 380, width: "100%",
        animation: "fadeIn 0.2s ease",
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, margin: "0 auto 16px",
          background: isOut ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
          border: `1px solid ${isOut ? "rgba(239,68,68,0.4)" : "rgba(34,197,94,0.4)"}`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
        }}>
          {isOut ? "🚗" : "✅"}
        </div>
        <h3 style={{ textAlign: "center", fontSize: 17, fontWeight: 700, marginBottom: 20, color: "#f1f5f9" }}>
          {isOut ? "Ghi nhận xe RA thành công" : "Ghi nhận xe VÀO thành công"}
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            ["Biển số", <span style={{ fontFamily: "'Courier New',monospace", color: "#60a5fa", fontWeight: 800, fontSize: 17 }}>{data.plate}</span>],
            ["Loại xe", VT_LABEL[data.vehicle_type] || data.vehicle_type],
            ["Giờ vào", fmt(data.entry_time)],
            isOut && ["Giờ ra", fmt(data.exit_time)],
            isOut && ["Thời gian đỗ", fmtDuration(data.duration_min)],
            isOut && ["Phí", <span style={{ color: "#22c55e", fontWeight: 800, fontSize: 17 }}>{fmtMoney(data.fee)}</span>],
          ].filter(Boolean).map(([k, v]) => (
            <div key={k} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 12px", borderRadius: 8,
              background: "rgba(8,15,30,0.5)", border: "1px solid rgba(30,50,90,0.6)",
            }}>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{k}</span>
              <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        <button onClick={onClose} style={{
          width: "100%", marginTop: 20, padding: "11px 0",
          background: "linear-gradient(135deg,#1d4ed8,#2563eb)",
          color: "#fff", border: "none", borderRadius: 8,
          fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>Đóng</button>
      </div>
    </div>
  );
}

// ─── Tab 1: Detection ───────────────────────────────────────────────────────
function DetectionTab({ onAction }) {
  const fileInputRef = useRef(null);
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [vehicleType, setVehicleType] = useState("motorbike");

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Vui lòng chọn tệp ảnh hợp lệ."); return; }
    const reader = new FileReader();
    reader.onload = (e) => { setImage(e.target.result); setError(null); setResult(null); };
    reader.readAsDataURL(file);
  };

  const handleDetect = async () => {
    if (!image) { setError("Vui lòng chọn ảnh trước."); return; }
    setLoading(true); setError(null);
    try {
      const blob = await fetch(image).then((r) => r.blob());
      const fd = new FormData();
      fd.append("file", blob, "image.jpg");
      const res = await fetch(`${API}/detect`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Lỗi máy chủ: ${res.status}`);
      setResult(await res.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleCheckin = async () => {
    if (!result?.plate || result.plate === "Not detected") { setError("Chưa nhận diện được biển số."); return; }
    setActionLoading("in");
    try {
      const res = await fetch(`${API}/checkin`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plate: result.plate, vehicle_type: vehicleType }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      onAction(data);
      setImage(null); setResult(null);
    } catch (e) { setError(e.message); }
    finally { setActionLoading(null); }
  };

  const handleCheckout = async () => {
    if (!result?.plate || result.plate === "Not detected") { setError("Chưa nhận diện được biển số."); return; }
    setActionLoading("out");
    try {
      const res = await fetch(`${API}/checkout`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plate: result.plate }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      onAction(data);
      setImage(null); setResult(null);
    } catch (e) { setError(e.message); }
    finally { setActionLoading(null); }
  };

  const confidencePct = result ? Math.min((result.confidence || 0) * 100, 100) : 0;
  const confColor = confidencePct >= 80 ? "34,197,94" : confidencePct >= 50 ? "245,158,11" : "239,68,68";
  const detected = result && result.plate && result.plate !== "Not detected";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 20 }}>
      {/* Left */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <SectionLabel>Tải Ảnh Lên</SectionLabel>

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
          style={{
            ...S.card,
            border: `2px dashed ${dragging ? "#3b82f6" : "rgba(59,130,246,0.3)"}`,
            padding: "32px 20px", textAlign: "center", cursor: "pointer",
            background: dragging ? "rgba(59,130,246,0.07)" : "rgba(13,26,51,0.5)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
            transition: "all 0.18s",
          }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="22" height="22" fill="none" stroke="#3b82f6" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 14, marginBottom: 3 }}>
              Kéo thả hoặc nhấp để chọn ảnh
            </p>
            <p style={{ color: "#475569", fontSize: 13 }}>JPG, PNG, GIF — tối đa 10 MB</p>
          </div>
          {image && <span style={S.badge("34,197,94")}>✓ Đã chọn ảnh</span>}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*"
          onChange={(e) => handleFile(e.target.files?.[0])} style={{ display: "none" }} />

        {/* Detect button */}
        <button onClick={handleDetect} disabled={!image || loading} style={{
          width: "100%", padding: "12px 0",
          background: !image || loading ? "rgba(51,65,85,0.7)" : "linear-gradient(135deg,#1d4ed8,#2563eb)",
          color: !image || loading ? "#475569" : "#fff",
          border: "none", borderRadius: 9, cursor: !image || loading ? "not-allowed" : "pointer",
          fontSize: 14, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "all 0.18s",
          boxShadow: !image || loading ? "none" : "0 3px 12px rgba(37,99,235,0.3)",
          fontFamily: "inherit",
        }}>
          {loading
            ? <><Spinner /> Đang nhận diện...</>
            : <><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> Nhận Diện Biển Số</>
          }
        </button>

        {/* Vehicle type + action buttons — only when detected */}
        {detected && (
          <div style={{ ...S.card, padding: 16, display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn 0.25s ease" }}>
            <div>
              <p style={S.label}>Loại phương tiện</p>
              <div style={{ display: "flex", gap: 8 }}>
                {["motorbike", "car"].map((vt) => (
                  <button key={vt} onClick={() => setVehicleType(vt)} style={{
                    flex: 1, padding: "8px 0", borderRadius: 7, cursor: "pointer",
                    border: `1px solid ${vehicleType === vt ? "rgba(59,130,246,0.6)" : "rgba(51,65,85,0.5)"}`,
                    background: vehicleType === vt ? "rgba(37,99,235,0.15)" : "rgba(8,15,30,0.5)",
                    color: vehicleType === vt ? "#60a5fa" : "#64748b",
                    fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                  }}>
                    {VT_ICON[vt]} {VT_LABEL[vt]}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleCheckin} disabled={!!actionLoading} style={{
                flex: 1, padding: "11px 0", borderRadius: 8, border: "none",
                background: actionLoading ? "rgba(51,65,85,0.6)" : "linear-gradient(135deg,#15803d,#16a34a)",
                color: actionLoading ? "#64748b" : "#fff",
                fontSize: 13, fontWeight: 700, cursor: actionLoading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontFamily: "inherit", boxShadow: actionLoading ? "none" : "0 2px 8px rgba(22,163,74,0.3)",
              }}>
                {actionLoading === "in" ? <Spinner /> : "↓"} Ghi nhận VÀO
              </button>
              <button onClick={handleCheckout} disabled={!!actionLoading} style={{
                flex: 1, padding: "11px 0", borderRadius: 8, border: "none",
                background: actionLoading ? "rgba(51,65,85,0.6)" : "linear-gradient(135deg,#b91c1c,#dc2626)",
                color: actionLoading ? "#64748b" : "#fff",
                fontSize: 13, fontWeight: 700, cursor: actionLoading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontFamily: "inherit", boxShadow: actionLoading ? "none" : "0 2px 8px rgba(220,38,38,0.3)",
              }}>
                {actionLoading === "out" ? <Spinner /> : "↑"} Ghi nhận RA
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: "11px 14px", borderRadius: 9,
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
            color: "#fca5a5", fontSize: 13, animation: "fadeIn 0.2s ease",
          }}>
            ⚠ {error}
          </div>
        )}
      </div>

      {/* Right */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <SectionLabel>Kết Quả Phân Tích</SectionLabel>

        <div style={{
          ...S.card, overflow: "hidden", minHeight: 220,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {image
            ? result
              ? <ImageRecognition image={image} result={result} />
              : <img src={image} alt="Preview" style={{ width: "100%", maxHeight: 280, objectFit: "contain", display: "block" }} />
            : <div style={{ textAlign: "center", padding: 32 }}>
                <svg width="36" height="36" fill="none" stroke="#1e3a5f" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: "0 auto 10px" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p style={{ color: "#334155", fontSize: 14 }}>Ảnh sẽ hiển thị tại đây</p>
              </div>
          }
        </div>

        {result ? (
          <div style={{ ...S.card, overflow: "hidden", animation: "fadeIn 0.3s ease" }}>
            <div style={{
              padding: "12px 18px", borderBottom: "1px solid rgba(59,130,246,0.12)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 6,
                background: detected ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                border: `1px solid ${detected ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
              }}>
                {detected ? "✓" : "✗"}
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>
                {detected ? "Nhận diện thành công" : "Không phát hiện biển số"}
              </span>
            </div>
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ padding: "14px 16px", borderRadius: 9, background: "rgba(8,15,30,0.5)", border: "1px solid rgba(37,99,235,0.2)" }}>
                <p style={S.label}>Biển Số</p>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#60a5fa", letterSpacing: 3, fontFamily: "'Courier New',monospace", lineHeight: 1.35 }}>
                  {plateLines(result.plate).map((line, i) => <div key={i}>{line}</div>)}
                </div>
              </div>
              {detected && (
                <div style={{ padding: "12px 16px", borderRadius: 9, background: "rgba(8,15,30,0.4)", border: "1px solid rgba(51,65,85,0.4)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <p style={S.label}>Độ Tin Cậy</p>
                    <span style={{ fontSize: 18, fontWeight: 800, color: `rgb(${confColor})`, fontFamily: "'Courier New',monospace" }}>
                      {confidencePct.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "rgba(51,65,85,0.5)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${confidencePct}%`, background: `rgb(${confColor})`, borderRadius: 3, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ ...S.card, padding: "18px", display: "flex", flexDirection: "column", gap: 10 }}>
            {["Biển Số", "Độ Tin Cậy"].map((lbl) => (
              <div key={lbl} style={{ padding: "12px 14px", borderRadius: 8, background: "rgba(8,15,30,0.4)", border: "1px solid rgba(51,65,85,0.3)" }}>
                <p style={{ ...S.label, marginBottom: 10 }}>{lbl}</p>
                <div style={{ height: 20, borderRadius: 4, background: "rgba(51,65,85,0.35)", width: "55%" }} />
              </div>
            ))}
            <p style={{ fontSize: 13, color: "#334155", textAlign: "center", marginTop: 4 }}>Kết quả hiện sau khi nhận diện</p>
          </div>
        )}

        {result && (
          <button onClick={() => { setImage(null); setResult(null); setError(null); }} style={{
            width: "100%", padding: "10px 0",
            background: "rgba(51,65,85,0.5)", border: "1px solid rgba(71,85,105,0.4)",
            color: "#94a3b8", borderRadius: 8, cursor: "pointer",
            fontSize: 13, fontWeight: 600, fontFamily: "inherit",
          }}>
            ↺ Nhận diện ảnh khác
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Tab 2: Active vehicles ─────────────────────────────────────────────────
function ActiveTab({ refresh }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await fetch(`${API}/active`).then((r) => r.json());
      setRows(data);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load, refresh]);
  useEffect(() => { const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const handleOut = async (plate) => {
    setActioning(plate);
    try {
      const res = await fetch(`${API}/checkout`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plate }),
      });
      const data = await res.json();
      if (data.success) { setModal(data); load(); }
    } catch (_) {}
    finally { setActioning(null); }
  };

  return (
    <div>
      {modal && <ConfirmModal data={modal} onClose={() => setModal(null)} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>Xe đang trong bãi</span>
          <span style={S.badge("59,130,246")}>{rows.length} xe</span>
        </div>
        <button onClick={load} style={{
          padding: "6px 14px", borderRadius: 7, background: "rgba(59,130,246,0.1)",
          border: "1px solid rgba(59,130,246,0.25)", color: "#60a5fa",
          fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>↻ Làm mới</button>
      </div>

      <div style={{ ...S.card, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#475569" }}>Đang tải...</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🅿️</div>
            <p style={{ color: "#475569", fontSize: 14 }}>Bãi xe hiện đang trống</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(8,15,30,0.5)" }}>
                  {["STT", "Biển số", "Loại xe", "Giờ vào", "Thời gian đỗ", "Phí tạm tính", ""].map((h) => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? "transparent" : "rgba(8,15,30,0.3)" }}>
                    <td style={S.td}><span style={{ color: "#475569", fontSize: 12 }}>{i + 1}</span></td>
                    <td style={S.td}>
                      <span style={{ fontFamily: "'Courier New',monospace", fontWeight: 800, color: "#60a5fa", fontSize: 15 }}>
                        {r.plate}
                      </span>
                    </td>
                    <td style={S.td}>{VT_ICON[r.vehicle_type]} {VT_LABEL[r.vehicle_type]}</td>
                    <td style={S.td}>{fmt(r.entry_time)}</td>
                    <td style={S.td}>{fmtDuration(r.duration_min)}</td>
                    <td style={S.td}>
                      <span style={{ color: "#22c55e", fontWeight: 700 }}>{fmtMoney(r.fee_estimate)}</span>
                    </td>
                    <td style={{ ...S.td, paddingRight: 14 }}>
                      <button onClick={() => handleOut(r.plate)} disabled={actioning === r.plate} style={{
                        padding: "5px 12px", borderRadius: 6, border: "none",
                        background: actioning === r.plate ? "rgba(51,65,85,0.5)" : "rgba(220,38,38,0.15)",
                        color: actioning === r.plate ? "#475569" : "#f87171",
                        fontSize: 12, fontWeight: 700, cursor: actioning === r.plate ? "not-allowed" : "pointer",
                        border: "1px solid rgba(220,38,38,0.3)", fontFamily: "inherit",
                      }}>
                        {actioning === r.plate ? "..." : "Ra xe"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p style={{ fontSize: 11, color: "#334155", marginTop: 10 }}>Tự động làm mới mỗi 30 giây</p>
    </div>
  );
}

// ─── Tab 3: History ─────────────────────────────────────────────────────────
function HistoryTab() {
  const today = new Date().toISOString().slice(0, 10);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ date: today, plate: "", status: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: 200,
        ...(filters.date   && { date: filters.date }),
        ...(filters.plate  && { plate: filters.plate }),
        ...(filters.status && { status: filters.status }),
      });
      const data = await fetch(`${API}/records?${params}`).then((r) => r.json());
      setRows(data);
    } catch (_) {}
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const inputStyle = {
    background: "rgba(8,15,30,0.6)", border: "1px solid rgba(59,130,246,0.2)",
    borderRadius: 7, padding: "8px 12px", color: "#e2e8f0", fontSize: 13,
    fontFamily: "inherit", outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Filters */}
      <div style={{ ...S.card, padding: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <p style={S.label}>Ngày</p>
          <input type="date" value={filters.date} onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))} style={inputStyle} />
        </div>
        <div>
          <p style={S.label}>Biển số</p>
          <input type="text" placeholder="VD: 59P1..." value={filters.plate}
            onChange={(e) => setFilters((f) => ({ ...f, plate: e.target.value }))}
            style={{ ...inputStyle, width: 140 }} />
        </div>
        <div>
          <p style={S.label}>Trạng thái</p>
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            style={{ ...inputStyle, cursor: "pointer" }}>
            <option value="">Tất cả</option>
            <option value="in">Đang đỗ</option>
            <option value="out">Đã ra</option>
          </select>
        </div>
        <button onClick={load} style={{
          padding: "8px 18px", borderRadius: 7,
          background: "linear-gradient(135deg,#1d4ed8,#2563eb)",
          color: "#fff", border: "none", fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
        }}>Tìm kiếm</button>
        <span style={{ ...S.badge("59,130,246"), alignSelf: "center" }}>{rows.length} bản ghi</span>
      </div>

      {/* Table */}
      <div style={{ ...S.card, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#475569" }}>Đang tải...</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>📋</div>
            <p style={{ color: "#475569", fontSize: 14 }}>Không có bản ghi nào</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(8,15,30,0.5)" }}>
                  {["Biển số", "Loại xe", "Giờ vào", "Giờ ra", "Thời gian", "Phí", "Trạng thái"].map((h) => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? "transparent" : "rgba(8,15,30,0.3)" }}>
                    <td style={S.td}>
                      <span style={{ fontFamily: "'Courier New',monospace", fontWeight: 800, color: "#60a5fa" }}>{r.plate}</span>
                    </td>
                    <td style={S.td}>{VT_ICON[r.vehicle_type]} {VT_LABEL[r.vehicle_type]}</td>
                    <td style={S.td}>{fmt(r.entry_time)}</td>
                    <td style={S.td}>{fmt(r.exit_time)}</td>
                    <td style={S.td}>{fmtDuration(r.duration_min)}</td>
                    <td style={S.td}>
                      {r.status === "out"
                        ? <span style={{ color: "#22c55e", fontWeight: 700 }}>{fmtMoney(r.fee)}</span>
                        : <span style={{ color: "#64748b" }}>—</span>
                      }
                    </td>
                    <td style={S.td}>
                      <span style={r.status === "in"
                        ? S.badge("59,130,246")
                        : S.badge("100,116,139")
                      }>
                        {r.status === "in" ? "Đang đỗ" : "Đã ra"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab 4: Revenue stats ───────────────────────────────────────────────────
function StatsTab() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (d) => {
    setLoading(true);
    try {
      const data = await fetch(`${API}/stats?date=${d}`).then((r) => r.json());
      setStats(data);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(date); }, [load, date]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Date picker */}
      <div style={{ ...S.card, padding: 14, display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>Ngày thống kê:</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{
          background: "rgba(8,15,30,0.6)", border: "1px solid rgba(59,130,246,0.2)",
          borderRadius: 7, padding: "7px 12px", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", outline: "none",
        }} />
        <button onClick={() => setDate(today)} style={{
          padding: "7px 14px", borderRadius: 7, border: "1px solid rgba(59,130,246,0.25)",
          background: "rgba(59,130,246,0.1)", color: "#60a5fa",
          fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>Hôm nay</button>
        {loading && <span style={{ color: "#475569", fontSize: 13 }}>Đang tải...</span>}
      </div>

      {stats && (
        <>
          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            <StatCard label="Tổng doanh thu" value={fmtMoney(stats.total_fee)} color="34,197,94" />
            <StatCard label="Tổng lượt xe" value={stats.total_vehicles} color="59,130,246" />
            <StatCard
              label="Xe máy"
              value={stats.motorbike_count}
              sub={fmtMoney(stats.motorbike_fee)}
              color="245,158,11"
            />
            <StatCard
              label="Ô tô"
              value={stats.car_count}
              sub={fmtMoney(stats.car_fee)}
              color="168,85,247"
            />
          </div>

          {/* Breakdown table */}
          <div style={{ ...S.card, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(59,130,246,0.1)", fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>
              Chi tiết ngày {date}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(8,15,30,0.5)" }}>
                  {["Loại xe", "Số lượt", "Doanh thu", "Tỷ lệ"].map((h) => <th key={h} style={S.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "🏍 Xe máy", count: stats.motorbike_count, fee: stats.motorbike_fee },
                  { label: "🚗 Ô tô",   count: stats.car_count,       fee: stats.car_fee },
                  { label: "📊 Tổng",   count: stats.total_vehicles,  fee: stats.total_fee, bold: true },
                ].map(({ label, count, fee, bold }) => (
                  <tr key={label}>
                    <td style={{ ...S.td, fontWeight: bold ? 700 : 400, color: bold ? "#f1f5f9" : "#cbd5e1" }}>{label}</td>
                    <td style={{ ...S.td, fontWeight: bold ? 700 : 400 }}>{count}</td>
                    <td style={{ ...S.td, color: "#22c55e", fontWeight: bold ? 800 : 600 }}>{fmtMoney(fee)}</td>
                    <td style={S.td}>
                      {stats.total_fee > 0
                        ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(51,65,85,0.5)" }}>
                              <div style={{ height: "100%", width: `${(fee / stats.total_fee) * 100}%`, background: "#3b82f6", borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 12, color: "#64748b", minWidth: 36 }}>
                              {stats.total_fee > 0 ? ((fee / stats.total_fee) * 100).toFixed(0) : 0}%
                            </span>
                          </div>
                        : <span style={{ color: "#334155" }}>—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rate reference */}
          <div style={{ ...S.card, padding: 16 }}>
            <p style={{ ...S.label, marginBottom: 12 }}>Biểu phí áp dụng</p>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { icon: "🏍", label: "Xe máy", price: "5.000 đ/giờ" },
                { icon: "🚗", label: "Ô tô",   price: "15.000 đ/giờ" },
                { icon: "⏱", label: "Miễn phí", price: "15 phút đầu" },
                { icon: "⏰", label: "Đơn vị tính", price: "30 phút/lần" },
              ].map((item) => (
                <div key={item.label} style={{
                  flex: 1, padding: "10px 12px", borderRadius: 8,
                  background: "rgba(8,15,30,0.4)", border: "1px solid rgba(51,65,85,0.4)",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{item.icon}</div>
                  <p style={{ fontSize: 11, color: "#64748b", marginBottom: 3 }}>{item.label}</p>
                  <p style={{ fontSize: 13, color: "#60a5fa", fontWeight: 700 }}>{item.price}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Spinner ────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{
      width: 14, height: 14, borderRadius: "50%",
      border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff",
      animation: "spin 0.7s linear infinite",
    }} />
  );
}

// ─── Root App ────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("detect");
  const [modal, setModal] = useState(null);
  const [activeCount, setActiveCount] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    fetch(`${API}/active`).then((r) => r.json()).then((d) => setActiveCount(d.length)).catch(() => {});
  }, [refreshTick]);

  const handleAction = (data) => {
    setModal(data);
    setRefreshTick((n) => n + 1);
  };

  const tabs = [
    { id: "detect",  icon: "🔍", label: "Nhận Diện" },
    { id: "active",  icon: "🅿️",  label: "Đang Đỗ", badge: activeCount },
    { id: "history", icon: "📋", label: "Lịch Sử" },
    { id: "stats",   icon: "📊", label: "Doanh Thu" },
  ];

  return (
    <div style={S.page}>
      {modal && <ConfirmModal data={modal} onClose={() => setModal(null)} />}

      {/* Subtle grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage:
          "linear-gradient(rgba(59,130,246,0.03) 1px,transparent 1px)," +
          "linear-gradient(90deg,rgba(59,130,246,0.03) 1px,transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1060, margin: "0 auto", padding: "32px 20px 60px" }}>

        {/* Header */}
        <header style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 9,
                background: "linear-gradient(135deg,#1d4ed8,#2563eb)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 16px rgba(37,99,235,0.35)",
              }}>
                <svg width="19" height="19" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#f1f5f9", letterSpacing: 0.2 }}>Hệ Thống Quản Lý Bãi Xe</div>
                <div style={{ fontSize: 11, color: "#475569" }}>Chung cư — Nhận diện biển số tự động</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", animation: "pulse-dot 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 600 }}>Hệ thống hoạt động</span>
            </div>
          </div>

          <h1 style={{ fontSize: 30, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.3px", lineHeight: 1.2, marginBottom: 16 }}>
            Nhận Diện{" "}
            <span style={{ background: "linear-gradient(90deg,#3b82f6,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Biển Số Xe
            </span>
          </h1>

          <TabBar tabs={tabs} active={tab} onChange={setTab} />
        </header>

        {/* Tab content */}
        {tab === "detect"  && <DetectionTab onAction={handleAction} />}
        {tab === "active"  && <ActiveTab refresh={refreshTick} />}
        {tab === "history" && <HistoryTab />}
        {tab === "stats"   && <StatsTab />}

        <footer style={{
          marginTop: 44, paddingTop: 20,
          borderTop: "1px solid rgba(51,65,85,0.35)",
          display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
        }}>
          <p style={{ fontSize: 12, color: "#334155" }}>Powered by <span style={{ color: "#3b82f6", fontWeight: 700 }}>YOLOv8</span> + <span style={{ color: "#3b82f6", fontWeight: 700 }}>PaddleOCR</span> + <span style={{ color: "#3b82f6", fontWeight: 700 }}>SQLite</span></p>
          <p style={{ fontSize: 12, color: "#334155" }}>Hệ thống quản lý an ninh chung cư</p>
        </footer>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.35} }
      `}</style>
    </div>
  );
}
