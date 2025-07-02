# main.py
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import shutil
from predict import predict_image

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    try:
        ext = os.path.splitext(image.filename)[1].lower()
        file_path = os.path.join(UPLOAD_DIR, f"{int(os.times()[4] * 1000)}{ext}")

        with open(file_path, "wb") as f:
            shutil.copyfileobj(image.file, f)

        result = predict_image(file_path)

        os.remove(file_path)

        return JSONResponse(content=result)

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
