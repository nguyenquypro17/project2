import { useEffect, useRef } from "react";

export default function ImageRecognition({ image, result }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!image || !canvasRef.current) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      if (result && result.box) {
        ctx.font = "bold 30px monospace";
        ctx.fillStyle = "#00ffff";
        ctx.strokeStyle = "#00ffff";
        ctx.lineWidth = 4;

        const [x1, y1, x2, y2] = result.box;
        const boxWidth = x2 - x1;
        const boxHeight = y2 - y1;

        ctx.strokeRect(x1, y1, boxWidth, boxHeight);
        ctx.fillText(result.plate || "No plate", x1, y1 - 10);
      }
    };
    img.src = image;
  }, [image, result]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      borderRadius: '8px',
      border: '1px solid rgba(6, 182, 212, 0.3)',
      background: '#1e293b',
      overflow: 'hidden',
    }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  );
}