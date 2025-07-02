import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [predictedImage, setPredictedImage] = useState(null);
  const [detections, setDetections] = useState([]);
  const [detectionHistory, setDetectionHistory] = useState([]);
  const [severityReport, setSeverityReport] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setPredictedImage(null);
    setDetections([]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("image", selectedFile);

    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/predict", formData);
      const currentDetections = res.data.detections || [];

      setPredictedImage(`data:image/jpeg;base64,${res.data.image}`);
      setDetections(currentDetections);

      const updatedHistory = [...detectionHistory, currentDetections];
      const trimmedHistory = updatedHistory.slice(-5);
      setDetectionHistory(trimmedHistory);

      const infestationImages = trimmedHistory.filter((img) =>
        img.some((d) => d.category === "infestation")
      );

      if (infestationImages.length >= 2) {
        const report = analyzeSeverity(infestationImages);
        setSeverityReport(report);
      } else {
        setSeverityReport([]);
      }
    } catch (err) {
      console.error("Prediction failed", err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeSeverity = (history) => {
    const totalImages = history.length;
    const labelCountMap = {};

    history.forEach((imageDetections) => {
      const uniqueLabels = new Set();
      imageDetections
        .filter((d) => d.category === "infestation")
        .forEach((detection) => {
          uniqueLabels.add(detection.label);
        });

      uniqueLabels.forEach((label) => {
        labelCountMap[label] = (labelCountMap[label] || 0) + 1;
      });
    });

    return Object.entries(labelCountMap).map(([label, count]) => {
      const percentPresence = (count / totalImages) * 100;
      let severity = "Low";
      if (percentPresence > 90) severity = "Highly Severe";
      else if (percentPresence > 50) severity = "Severe";
      else if (percentPresence >= 30) severity = "Moderate";

      return { label, count, percentPresence, severity };
    });
  };

  const handleClearHistory = () => {
    setDetectionHistory([]);
    setSeverityReport([]);
    setPredictedImage(null);
    setDetections([]);
  };

  const handleDownloadCSV = () => {
    if (severityReport.length === 0) return;

    const headers = ["Label", "Count", "Percent Presence", "Severity"];
    const rows = severityReport.map((row) => [
      row.label,
      row.count,
      row.percentPresence.toFixed(1) + "%",
      row.severity,
    ]);

    const csvContent =
      [headers, ...rows]
        .map((row) => row.join(","))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "severity_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const crops = detections.filter((d) => d.category === "crop");
  const infestations = detections.filter((d) => d.category === "infestation");
  const biotic = infestations.filter((d) => d.type === "biotic");
  const abiotic = infestations.filter((d) => d.type === "abiotic");

  return (
    <div className="app-container">
      <header>
        <h1>Pest Detection Dashboard</h1>
      </header>

      <div className="upload-section">
        <h2>Upload Crop Infestation Image</h2>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={loading}>
          {loading ? "Predicting..." : "Upload & Predict"}
        </button>

        <div style={{ marginTop: "10px" }}>
          <button onClick={handleClearHistory}>🧹 Clear History</button>
          <button onClick={handleDownloadCSV} disabled={severityReport.length === 0}>
            📥 Download CSV
          </button>
        </div>

        {loading && <div className="loader">Loading...</div>}

        {predictedImage && (
          <div className="result-section">
            <img src={predictedImage} alt="Prediction" className="predicted-image" />

            {crops.length > 0 && (
              <div className="label-section_2">
                <h4>Detected Crop(s):</h4>
                <ul>
                  {crops.map((c, idx) => (
                    <li key={idx}>{c.label}</li>
                  ))}
                </ul>
              </div>
            )}

            {biotic.length > 0 && (
              <div className="label-section_2">
                <h4>Biotic Infestation(s):</h4>
                <ul>
                  {biotic.map((b, idx) => (
                    <li key={idx}>{b.label}</li>
                  ))}
                </ul>
              </div>
            )}

            {abiotic.length > 0 && (
              <div className="label-section_2">
                <h4>Abiotic Infestation(s):</h4>
                <ul>
                  {abiotic.map((a, idx) => (
                    <li key={idx}>{a.label}</li>
                  ))}
                </ul>
              </div>
            )}

            {severityReport.length > 0 && (
              <div className="label-section_2">
                <h4>🔥 Severity Analysis (Last 5 Images with Infestations):</h4>
                <ul>
                  {severityReport.map((s, idx) => (
                    <li key={idx}>
                      <strong>{s.label}</strong> — {s.count} of{" "}
                      {detectionHistory.filter((img) =>
                        img.some((d) => d.category === "infestation")
                      ).length}{" "}
                      image(s) — {s.percentPresence.toFixed(1)}% —{" "}
                      <span
                        style={{
                          color:
                            s.severity === "Highly Severe"
                              ? "darkred"
                              : s.severity === "Severe"
                              ? "red"
                              : s.severity === "Moderate"
                              ? "orange"
                              : "green",
                        }}
                      >
                        <strong>{s.severity}</strong>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {severityReport.length === 0 &&
              detectionHistory.length > 0 && (
                <div className="label-section_2">
                  <p style={{ fontStyle: "italic", color: "gray" }}>
                    Severity analysis will begin once at least 2 images contain infestations.
                  </p>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
