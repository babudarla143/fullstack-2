from ultralytics import YOLO
from PIL import Image
import io
import base64

# Load model
model = YOLO("/home/haribabu/Desktop/pest_ui/new_model_26/last.pt")

# Define label categories (same as your dictionary)
label_categories = {
    "paddy": {"category": "crop"},
    "chilli": {"category": "crop"},
    "soyabean": {"category": "crop"},
    "cotton": {"category": "crop"},
    "maize": {"category": "crop"},
    "ground": {"category": "crop"},
    "rice": {"category": "crop"},
    "armywarm": {"category": "infestation"},
    "armyworm": {"category": "infestation"},
    "arymworm": {"category": "infestation"},
    "rice stem borer": {"category": "infestation"},
    "rice stem borar": {"category": "infestation"},
    "brown planthopper": {"category": "infestation"},
    "brown spot": {"category": "infestation"},
    "blast": {"category": "infestation"},
    "bacterial leaf blight": {"category": "infestation"},
    "bacterial leaf strike": {"category": "infestation"},
    "bakana disease": {"category": "infestation"},
    "rice tungro disease": {"category": "infestation"},
    "rice gall midge": {"category": "infestation"},
    "gall midge (orseolia oryzae)": {"category": "infestation"},
    "green leafhopper (nephotettix virescens)": {"category": "infestation"},
    "green leaf hoper": {"category": "infestation"},
    "rice gundhi bug (leptocorisa acuta)": {"category": "infestation"},
    "rice hispa (dicladispa armigera)": {"category": "infestation"},
    "rice root-knot nematode (meloidogyne graminicola)": {"category": "infestation"},
    "sheath blight (rhizoctonia solani)": {"category": "infestation"},
    "grassy stunt virus": {"category": "infestation"},
    "weed": {"category": "infestation"},
    "echinochloa crus-galli (barnyard grass)": {"category": "infestation"},
    "leptochloa chinensis (sprangletop)": {"category": "infestation"},
    "monochoria vaginalis (pickerelweed)": {"category": "infestation"},
    "abiotic": {"category": "cause of nature"},
    "biotic": {"category": "cause by living things"},
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

            info = label_categories.get(label_lower, {"category": "unknown", "type": ""})

            detections.append({
                "label": class_name,
                "confidence": round(conf, 3),
                "category": info["category"],
                "type": info.get("type", "")
            })

        # Encode the annotated image to base64
        im_array = r.plot()
        im = Image.fromarray(im_array).convert("RGB")
        buffer = io.BytesIO()
        im.save(buffer, format="JPEG")
        base64_image = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return {
        "image": base64_image,
        "detections": detections
    }
