from ultralytics import YOLO
from PIL import Image
import io
import base64
import os
import gdown

# Function to download model from Google Drive
def download_model_if_missing():
    model_dir = "/home/haribabu/Desktop/pest_ui/model"
    model_path = os.path.join(model_dir, "last.pt")
    file_id = "1WZyaTwfSX4aqU_Z_X36dRLCCckLdQash"
    gdrive_url = f"https://drive.google.com/uc?id={file_id}"

    if not os.path.exists(model_dir):
        os.makedirs(model_dir)

    if not os.path.exists(model_path):
        print("Downloading model from Google Drive...")
        gdown.download(gdrive_url, model_path, quiet=False)
    else:
        print(" Model already exists.")

    return model_path

# Load your trained YOLO model
model_path = download_model_if_missing()
model = YOLO(model_path)

# Label to category map
label_categories = {
    # crops...
    "paddy": {"category": "crop"},
    "chilli": {"category": "crop"},
    "soyabean": {"category": "crop"},
    "cotton": {"category": "crop"},
    "maize": {"category": "crop"},
    "ground": {"category": "crop"},
    "rice": {"category": "crop"},
    
    # infestations...
    "armywarm": {"category": "infestation", "type": "biotic"},
    "armyworm": {"category": "infestation", "type": "biotic"},
    "arymworm": {"category": "infestation", "type": "biotic"},
    "rice stem borer": {"category": "infestation", "type": "biotic"},
    "rice stem borar": {"category": "infestation", "type": "biotic"},
    "brown planthopper": {"category": "infestation", "type": "biotic"},
    "brown spot": {"category": "infestation", "type": "biotic"},
    "blast": {"category": "infestation", "type": "biotic"},
    "bacterial leaf blight": {"category": "infestation", "type": "biotic"},
    "bacterial leaf strike": {"category": "infestation", "type": "biotic"},
    "bakana disease": {"category": "infestation", "type": "biotic"},
    "rice tungro disease": {"category": "infestation", "type": "biotic"},
    "rice gall midge": {"category": "infestation", "type": "biotic"},
    "gall midge (orseolia oryzae)": {"category": "infestation", "type": "biotic"},
    "green leafhopper (nephotettix virescens)": {"category": "infestation", "type": "biotic"},
    "green leaf hoper": {"category": "infestation", "type": "biotic"},
    "rice gundhi bug (leptocorisa acuta)": {"category": "infestation", "type": "biotic"},
    "rice hispa (dicladispa armigera)": {"category": "infestation", "type": "biotic"},
    "rice root-knot nematode (meloidogyne graminicola)": {"category": "infestation", "type": "biotic"},
    "sheath blight (rhizoctonia solani)": {"category": "infestation", "type": "biotic"},
    "grassy stunt virus": {"category": "infestation", "type": "biotic"},
    "weed": {"category": "infestation", "type": "biotic"},
    "echinochloa crus-galli (barnyard grass)": {"category": "infestation", "type": "biotic"},
    "leptochloa chinensis (sprangletop)": {"category": "infestation", "type": "biotic"},
    "monochoria vaginalis (pickerelweed)": {"category": "infestation", "type": "biotic"},

    "abiotic": {"category": "nature ", "type": "abiotic"}
}

def predict_image(image_path: str) -> dict:
    results = model.predict(
        source=image_path,
        conf=0.45,
        save=False,
        save_txt=False,
        show=False
    )

    detections = []
    base64_image = ""

    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            class_name = model.names.get(cls_id, f"class_{cls_id}")
            conf = float(box.conf[0]) if box.conf is not None else 0.0
            label_lower = class_name.lower()

            info = label_categories.get(label_lower, {"category": "unknown", "type": "unknown"})

            detections.append({
                "label": class_name,
                "category": info.get("category", "unknown"),
                "type": info.get("type", "unknown"),
                "confidence": round(conf, 3)
            })

        # Convert result image to base64
        im_array = r.plot()
        im = Image.fromarray(im_array).convert("RGB")
        buffer = io.BytesIO()
        im.save(buffer, format="JPEG")
        base64_image = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return {
        "image": base64_image,
        "detections": detections
    }
