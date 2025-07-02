const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

app.post("/predict", upload.single("image"), (req, res) => {
  const imagePath = path.resolve(req.file.path);
  console.log("Uploaded File:", imagePath);

  execFile("python", ["predict.py", imagePath], { cwd: __dirname }, (err, stdout, stderr) => {
    // Comment out below line if you want to keep uploaded images
    fs.unlink(imagePath, () => {});

    if (err) {
      console.error("Python Error:", stderr);
      return res.status(500).json({ error: "Prediction failed" });
    }

    const base64Image = stdout.toString().trim();
    res.json({ image: base64Image });
  });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
