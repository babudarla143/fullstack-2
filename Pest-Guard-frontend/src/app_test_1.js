import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [predictedImage, setPredictedImage] = useState(null);
  const [detections, setDetections] = useState([]);
  const [detectionHistory, setDetectionHistory] = useState([]);
  const [severityReport, setSeverityReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setPredictedImage(null);
    setDetections([]);
  };

  const handleUpload = async () => {
    if (!selectedFile || detectionHistory.length >= 10) return;

    const formData = new FormData();
    formData.append("image", selectedFile);

    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/predict", formData);
      const currentDetections = res.data.detections || [];

      setPredictedImage(`data:image/jpeg;base64,${res.data.image}`);
      setDetections(currentDetections);

      const updatedHistory = [...detectionHistory, currentDetections];
      setDetectionHistory(updatedHistory);

      if (updatedHistory.length === 10) {
        const report = analyzeSeverity(updatedHistory);
        setSeverityReport(report);
      } else {
        setSeverityReport(null);
      }
    } catch (err) {
      console.error("Prediction failed", err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeSeverity = (history) => {
    const cropCountMap = {};
    const cropConfidenceMap = {};
    const infestationCountMap = {};
    const infestationConfidenceMap = {};

    history.forEach((imageDetections) => {
      imageDetections.forEach(({ label, confidence, category }) => {
        if (category === "crop") {
          cropCountMap[label] = (cropCountMap[label] || 0) + 1;
          cropConfidenceMap[label] = cropConfidenceMap[label] || [];
          cropConfidenceMap[label].push(confidence);
        }

        if (category === "infestation") {
          infestationCountMap[label] = (infestationCountMap[label] || 0) + 1;
          infestationConfidenceMap[label] = infestationConfidenceMap[label] || [];
          infestationConfidenceMap[label].push(confidence);
        }
      });
    });

    const infestationReport = Object.entries(infestationCountMap).map(
      ([label, count]) => {
        const confidenceList = infestationConfidenceMap[label] || [];
        const avgConf = confidenceList.reduce((a, b) => a + b, 0) / confidenceList.length;
        return {
          label,
          score: ((count / 10) * 100).toFixed(1),
          confidence: (avgConf * 100).toFixed(1),
        };
      }
    );

    let finalCrop = "";
    let maxCount = 0;
    for (const crop in cropCountMap) {
      if (cropCountMap[crop] > maxCount) {
        finalCrop = crop;
        maxCount = cropCountMap[crop];
      }
    }

    let majorInfestation = "";
    let highestScore = 0;
    infestationReport.forEach((r) => {
      if (parseFloat(r.score) > highestScore) {
        highestScore = parseFloat(r.score);
        majorInfestation = r.label;
      }
    });

    const formattedReport = infestationReport.map((r) => ({
      ...r,
      isMajor: r.label === majorInfestation,
    }));

    return {
      finalCrop,
      majorInfestation,
      infestationReport: formattedReport,
      cropCountMap,
      cropConfidenceMap,
      cropDamage: highestScore.toFixed(1),
    };
  };

  const handleDownloadCSVReport = () => {
    if (!severityReport) return;

    const rows = [];
    rows.push(["Crop Tracking"]);
    rows.push(["Crop Label", "Count", "Average Confidence"]);
    Object.entries(severityReport.cropCountMap).forEach(([label, count]) => {
      const confidences = severityReport.cropConfidenceMap[label] || [];
      const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
      rows.push([label, count, avgConfidence.toFixed(3)]);
    });

    rows.push([]);
    rows.push(["Infestation Tracking"]);
    rows.push(["Infestation Label", "Severity (%)", "Avg Confidence", "Is Major"]);
    severityReport.infestationReport.forEach((r) => {
      rows.push([r.label, r.score, r.confidence, r.isMajor ? "Yes" : "No"]);
    });

    rows.push([]);
    rows.push(["Final Results"]);
    rows.push(["Final Crop", severityReport.finalCrop]);
    rows.push(["Major Infestation", severityReport.majorInfestation]);
    rows.push(["Estimated Crop Damage (%)", severityReport.cropDamage]);

    const csvContent = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "crop_infestation_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearHistory = () => {
    setDetectionHistory([]);
    setSeverityReport(null);
    setPredictedImage(null);
    setDetections([]);
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
        <button onClick={handleUpload} disabled={loading || detectionHistory.length >= 10}>
          {loading ? "Predicting..." : "Upload & Predict"}
        </button>

        <p style={{ marginTop: '10px' }}>Uploaded Images: {detectionHistory.length} / 10</p>

        <div style={{ marginTop: "10px" }}>
          <button onClick={handleClearHistory}>🧹 Clear History</button>
          <button onClick={handleDownloadCSVReport} disabled={!severityReport}>
            📥 Download Full Report (CSV)
          </button>
        </div>

        {loading && <div className="loader">Loading...</div>}

        {predictedImage && (
          <div className="result-section">
            <div className="prediction-layout">
              <img
                src={predictedImage}
                alt="Prediction"
                className="predicted-image"
              />

              <div className="label-sections-wrapper">
                {crops.length > 0 && (
                  <div className="label-section_2">
                    <h4>Detected Crop(s):</h4>
                    <ul>
                      {crops.map((c, idx) => (
                        <li key={idx}>
                          {c.label} — Confidence: {c.confidence.toFixed(3)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {biotic.length > 0 && (
                  <div className="label-section_2">
                    <h4>Biotic Infestation(s):</h4>
                    <ul>
                      {biotic.map((b, idx) => (
                        <li key={idx}>
                          {b.label} — Confidence: {b.confidence.toFixed(3)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {abiotic.length > 0 && (
                  <div className="label-section_2">
                    <h4>Abiotic Infestation(s):</h4>
                    <ul>
                      {abiotic.map((a, idx) => (
                        <li key={idx}>
                          {a.label} — Confidence: {a.confidence.toFixed(3)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {severityReport && (
                  <>
                    <div className="label-section_2">
                      <h4>Final Crop (Most Frequent):</h4>
                      <p><strong>{severityReport.finalCrop}</strong></p>
                    </div>

                    <div className="label-section_2">
                      <h4>Major Crop Damage:</h4>
                      <p><strong>{severityReport.majorInfestation}</strong> — {severityReport.cropDamage}%</p>
                    </div>

                    <div className="label-section_2">
                      <h4>All Infestations:</h4>
                      <ul>
                        {severityReport.infestationReport.map((r, idx) => (
                          <li key={idx}>
                            {r.label} — Severity: {r.score}%, Avg Conf: {r.confidence}%
                            {r.isMajor ? " 🔥" : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {!severityReport && detectionHistory.length > 0 && (
                  <div className="label-section_2">
                    <p style={{ fontStyle: "italic", color: "gray" }}>
                      Severity analysis starts after uploading 10 images.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
