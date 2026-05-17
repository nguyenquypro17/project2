from ultralytics import YOLO
import torch

print(f"GPU: {torch.cuda.get_device_name(0)}")
print(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")

dataset_path = "/home/hieuquy/project2/Large-License-Plate-Detection-Dataset"
data_yaml = f"{dataset_path}/data.yaml"

# Train với hyperparameter mặc định
model = YOLO("yolov8m.pt")
model.train(
    data=data_yaml,
    epochs=100,
    patience=10,
    device=0,
    project="runs/train",
    name="train_8m"
)

# Evaluate trên tập test
best_model = YOLO("runs/train/train_8m/weights/best.pt")
metrics = best_model.val(data=data_yaml, split="test", device=0)
print(f"mAP50: {metrics.box.map50:.4f}")
print(f"mAP50-95: {metrics.box.map:.4f}")
print(f"Precision: {metrics.box.mp:.4f}")
print(f"Recall: {metrics.box.mr:.4f}")