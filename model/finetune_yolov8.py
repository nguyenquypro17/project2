from ultralytics import YOLO
import yaml
import torch

print(f"GPU: {torch.cuda.get_device_name(0)}")
print(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")

dataset_path = "/home/hieuquy/project2/Large-License-Plate-Detection-Dataset"
data_yaml = f"{dataset_path}/data.yaml"

# Bước 1: Tune với YOLOv8m
model = YOLO("yolov8m.pt")
model.tune(
    data=data_yaml,
    epochs=50,
    iterations=20,
    device=0, # Sử dụng GPU
    project="runs/tune",
    name="tune_8m"
)

# Bước 2: Lấy và lưu best hyperparameters
with open("runs/tune/tune_8m/best_hyperparameters.yaml") as f:
    best_params = yaml.safe_load(f)

with open("best_params.yaml", "w", encoding="utf-8") as f:
    yaml.dump(best_params, f, default_flow_style=False, allow_unicode=True)

print("Saved best_params.yaml")

# Bước 3: Train với best params
model = YOLO("yolov8m.pt")
model.train(
    data=data_yaml,
    epochs=100,
    device=0, # Sử dụng GPU
    project="runs/train",
    name="train_8m",
    **best_params
)

# Bước 4: Evaluate trên tập test
best_model = YOLO("runs/train/train_8m/weights/best.pt")
metrics = best_model.val(data=data_yaml, split="test", device=0)
print(f"mAP50: {metrics.box.map50:.4f}")
print(f"mAP50-95: {metrics.box.map:.4f}")
print(f"Precision: {metrics.box.mp:.4f}")
print(f"Recall: {metrics.box.mr:.4f}")