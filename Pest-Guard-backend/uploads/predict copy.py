from ultralytics import YOLO
from PIL import Image
import io
import base64

# Load the trained YOLO model
model = YOLO("/home/haribabu/Desktop/pest_ui/new_model_26/last.pt")

# Mapping of class names to their categories and types
label_categories = {
    # Crops
    "paddy": {"category": "crop"},
    "chilli": {"category": "crop"},
    "soyabean": {"category": "crop"},
    "cotton": {"category": "crop"},
    "maize": {"category": "crop"},
    "ground": {"category": "crop"},
    "rice": {"category": "crop"},  # normalized to lowercase

    # Infestations (Pests/Diseases/Weeds)
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

    # Abiotic Stress Labels (add according to your dataset)
    # "drought": {"category": "infestation", "type": "abiotic"},
    # "flood": {"category": "infestation", "type": "abiotic"},
    # "nutrient deficiency": {"category": "infestation", "type": "abiotic"},
    # "heat stress": {"category": "infestation", "type": "abiotic"},
    # "cold stress": {"category": "infestation", "type": "abiotic"},
    # "salinity": {"category": "infestation", "type": "abiotic"},

    "abiotic": {"category": "cause of nature"},
    "biotic": {"category": " cause by living thingd"},  
}


def predict_image(image_path: str) -> dict:
    results = model.predict(
        source=image_path,
        conf=0.45,
        save=False,
        save_txt=False,
        show=False
    )

    detected_labels = []
    base64_image = ""

    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            class_name = model.names.get(cls_id, f"class_{cls_id}")
            detected_labels.append(class_name)

        # Convert image to base64
        im_array = r.plot()
        im = Image.fromarray(im_array).convert("RGB")
        buffer = io.BytesIO()
        im.save(buffer, format="JPEG")
        base64_image = base64.b64encode(buffer.getvalue()).decode("utf-8")

    unique_labels = list(set(detected_labels))

    categorized_output = []
    for label in unique_labels:
        label_lower = label.lower()
        info = label_categories.get(label_lower, {"category": "unknown", "type": "unknown"})
        categorized_output.append({
            "label": label,
            "category": info.get("category", "unknown"),
            "type": info.get("type", "")
        })

    return {
        "image": base64_image,
        "detections": categorized_output
    }

