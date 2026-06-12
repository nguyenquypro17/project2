"""
Fine-tune best.pt on the split Vietnam License Plate dataset,
freezing the backbone (layers 0-9: Conv x2, C2f x4, SPPF) so only the
neck/head (Detect) is trained.

Usage (e.g. on the training server):
    python finetune_head.py \
        --data "Vietnam License plate.v4i.yolov8/data.yaml" \
        --weights model/best.pt \
        --epochs 100 --patience 20 --batch 16 --imgsz 640 --device 0

Early stopping: training stops if val performance doesn't improve for
`--patience` epochs (Ultralytics' built-in EarlyStopping).
"""

import argparse

from ultralytics import YOLO

# YOLOv8 backbone = layers 0-9 (Conv x2, C2f x4, SPPF)
FREEZE_BACKBONE = [f"model.{i}." for i in range(10)]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="Vietnam License plate.v4i.yolov8/data.yaml")
    parser.add_argument("--weights", default="model/best.pt")
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--patience", type=int, default=20, help="early stopping patience (epochs w/o improvement)")
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--device", default="0", help="'0' for GPU 0, 'cpu', 'mps', etc.")
    parser.add_argument("--project", default="runs/finetune")
    parser.add_argument("--name", default="head_only")
    args = parser.parse_args()

    model = YOLO(args.weights)
    model.train(
        data=args.data,
        epochs=args.epochs,
        patience=args.patience,
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device,
        freeze=FREEZE_BACKBONE,
        project=args.project,
        name=args.name,
        exist_ok=True,
    )


if __name__ == "__main__":
    main()
