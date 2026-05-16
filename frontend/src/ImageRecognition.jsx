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

      if (result) {
        ctx.font = "bold 20px monospace";
        ctx.fillStyle = "#00ffff";
        ctx.strokeStyle = "#00ffff";
        ctx.lineWidth = 3;

        const boxWidth = 200;
        const boxHeight = 60;
        const padding = 20;

        ctx.strokeRect(padding, padding, boxWidth, boxHeight);
        ctx.fillText(result.plate || "No plate", padding + 10, padding + 40);
      }
    };
    img.src = image;
  }, [image, result]);

  return (
    <div style={{
      width: '100%',
      borderRadius: '8px',
      border: '1px solid rgba(6, 182, 212, 0.3)',
      background: '#1e293b',
      overflow: 'hidden',
    }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: 'auto',
          maxHeight: '384px',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </div>
  );
}
