import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageHistory, setImageHistory] = useState([]);
  const [severityReport, setSeverityReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile || imageHistory.length >= 5) return;

    const formData = new FormData();
    formData.append("image", selectedFile);

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/predict`, formData);
      const currentDetections = res.data.detections || [];
      const base64Img = `data:image/jpeg;base64,${res.data.image}`;

      const newEntry = { image: base64Img, detections: currentDetections };
      const updated = [...imageHistory, newEntry];
      setImageHistory(updated);

      if (updated.length === 5) {
        const report = analyzeSeverity(updated.map((img) => img.detections));
        setSeverityReport(report);
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
  const infestationTypeMap = {};

  history.forEach((imageDetections) => {
    const seenInfestationLabels = new Set(); 

    imageDetections.forEach(({ label, confidence, category, type }) => {
      if (category === "crop") {
        cropCountMap[label] = (cropCountMap[label] || 0) + 1;
        cropConfidenceMap[label] = cropConfidenceMap[label] || [];
        cropConfidenceMap[label].push(confidence);
      }

      if (category === "infestation") {

        if (!seenInfestationLabels.has(label)) {
          infestationCountMap[label] = (infestationCountMap[label] || 0) + 1;
          seenInfestationLabels.add(label);
        }


        infestationConfidenceMap[label] = infestationConfidenceMap[label] || [];
        infestationConfidenceMap[label].push(confidence);


        if (!infestationTypeMap[label]) {
          infestationTypeMap[label] = type || "unknown";
        }
      }
    });
  });

  const infestationReport = Object.entries(infestationCountMap).map(([label, count]) => {
    const confidenceList = infestationConfidenceMap[label] || [];
    const avgConf = confidenceList.reduce((a, b) => a + b, 0) / confidenceList.length;
    return {
      label,
      type: infestationTypeMap[label] || "unknown",
      score: ((count / history.length) * 100).toFixed(1),
      confidence: (avgConf * 100).toFixed(1),
    };
  });


  let majorInfestation = "";
  let maxCount = 0;
  let maxAvgConfidence = 0;

  Object.entries(infestationCountMap).forEach(([label, count]) => {
    const confidenceList = infestationConfidenceMap[label] || [];
    const avgConfidence = confidenceList.reduce((a, b) => a + b, 0) / confidenceList.length;

    if (count > maxCount || (count === maxCount && avgConfidence > maxAvgConfidence)) {
      majorInfestation = label;
      maxCount = count;
      maxAvgConfidence = avgConfidence;
    }
  });

  const formattedReport = infestationReport.map((r) => ({
    ...r,
    isMajor: r.label === majorInfestation,
  }));

  // Determine most frequent crop
  let finalCrop = "";
  let maxCropCount = 0;
  for (const crop in cropCountMap) {
    if (cropCountMap[crop] > maxCropCount) {
      finalCrop = crop;
      maxCropCount = cropCountMap[crop];
    }
  }

  const cropDamage = (
    Object.entries(infestationCountMap)
      .map(([label, count]) => (count / history.length) * 100)
      .reduce((a, b) => a + b, 0) / Object.keys(infestationCountMap).length
  ).toFixed(1);

  return {
    finalCrop,
    majorInfestation,
    infestationReport: formattedReport,
    cropCountMap,
    cropConfidenceMap,
    cropDamage,
  };
};

  const handleClear = () => {
    setImageHistory([]);
    setSeverityReport(null);
    setSelectedFile(null);
  };
  return (
    <div className="app-container">
      <header>
        <h1>Pest Detection Dashboard</h1>
      </header>

      <div className="upload-section">
        <h2>Upload Crop Infestation Image</h2>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={loading || imageHistory.length >= 5}>
          {loading ? "Predicting..." : "Upload & Predict"}
        </button>

        <p>Uploaded Images: {imageHistory.length} / 5</p>
        <button onClick={handleClear}>🧹 Clear All</button>
      </div>

      <div className="images-grid">
        {imageHistory.map((entry, index) => {
          const crops = entry.detections.filter((d) => d.category === "crop");
          const infestations = entry.detections.filter((d) => d.category === "infestation");
          const biotic = infestations.filter((d) => d.type === "biotic");
          const abiotic = infestations.filter((d) => d.type === "abiotic");

          return (
            <div key={index} className="image-card">
              <img src={entry.image} alt={`Uploaded ${index + 1}`} />
              <div className="label-section">
                {crops.length > 0 && (
                  <>
                    <h4>Detected Crop(s):</h4>
                    <ul>
                      {crops.map((c, i) => (
                        <li key={i}>{c.label} — Confidence: {c.confidence.toFixed(2)}</li>
                      ))}
                    </ul>
                  </>
                )}

                {infestations.length > 0 && (
                  <>
                    <h4>Detected Infestation(s):</h4>
                    <ul>
                      {infestations.map((inf, i) => (
                        <li key={i}>{inf.label} — Confidence: {inf.confidence.toFixed(2)}</li>
                      ))}
                    </ul>
                  </>
                )}

                {biotic.length > 0 && (
                  <>
                    <h4>Biotic:</h4>
                    <ul>
                      {biotic.map((b, i) => (
                        <li key={i}>{b.label} — {b.confidence.toFixed(2)}</li>
                      ))}
                    </ul>
                  </>
                )}

                {abiotic.length > 0 && (
                  <>
                    <h4>Abiotic:</h4>
                    <ul>
                      {abiotic.map((a, i) => (
                        <li key={i}>{a.label} — {a.confidence.toFixed(2)}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {severityReport && (
        <div className="final-report">
          <h2>Final Report</h2>
          <p><strong>Most Frequent Crop:</strong> {severityReport.finalCrop}</p>
           <p>
            <strong>Major Infestation:</strong> {severityReport.majorInfestation}{" "}
            (
              {
                severityReport.infestationReport.find(
                  (r) => r.label === severityReport.majorInfestation
                )?.type || "unknown"
              }
            )
          </p>
          {/* <p><strong>Major Infestation:</strong> {severityReport.majorInfestation}</p> */}
          <p><strong>Estimated Crop Damage:</strong> {severityReport.cropDamage}%</p>

          <h3>Infestation Breakdown:</h3>
          <ul>
            {severityReport.infestationReport.map((r, idx) => (
              <li key={idx}>
                {r.label} ({r.type}) — Severity: {r.score}% | Avg Confidence: {r.confidence}%
                {r.isMajor ? " " : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
