import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./styles.css";
const API_BASE = "https://nonconcentrated-fawn-agrostographical.ngrok-free.dev";

export default function App() {
  const [frames, setFrames] = useState([]);
  const [videoUrl, setVideoUrl] = useState(null);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [boxes, setBoxes] = useState([]);
  const [selectedBox, setSelectedBox] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [theme, setTheme] = useState("dark");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showDashboard, setShowDashboard] = useState(false);

  const videoRef = useRef(null);
  const imgRef = useRef(null);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, videoUrl]);

  const resetSequence = () => {
    if (window.confirm("Clear all buffered data and disconnect source?")) {
      setFrames([]);
      setVideoUrl(null);
      setSelectedFrame(null);
      setBoxes([]);
      setPredictions([]);
      setSelectedBox(null);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("video", file);
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/upload-video/`, formData);
      setFrames(res.data.frames);
      setVideoUrl(`${API_BASE}${res.data.video_url}`);
      setSelectedFrame(null);
    } catch (err) { 
      alert("Upload failed. Ensure Backend is running.");
    } finally { setLoading(false); }
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;
    if (!videoRef.current.paused) return alert("System requires frame stabilization. Please pause the video.");
    
    setLoading(true);
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("frame", blob, "capture.jpg");
      try {
        const capRes = await axios.post(`${API_BASE}/api/capture-frame/`, formData);
        const detRes = await axios.post(`${API_BASE}/api/detect-plates/`, { frame_url: capRes.data.frame_url });
        setSelectedFrame(capRes.data.frame_url);
        setBoxes(detRes.data.boxes || []);
        setPredictions([]);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }, "image/jpeg");
  };

  const handleFrameClick = async (frame) => {
    setSelectedFrame(frame);
    setPredictions([]);
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/detect-plates/`, { frame_url: frame });
      setBoxes(res.data.boxes || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleBoxClick = async (box, index) => {
    setSelectedBox(index);
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/recognize-plate/`, {
        frame_url: selectedFrame,
        x1: box.x1, y1: box.y1, x2: box.x2, y2: box.y2,
      });
      setPredictions([{
        text: res.data.plate_number,
        confidence: res.data.confidence,
        isError: res.data.is_error 
      }]);
    } catch (err) { 
      setPredictions([{ text: "OCR ERROR", confidence: 0, isError: true }]);
    } finally { setLoading(false); }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/get-predictions/`, {
        params: { date: filterDate },
      });
      setHistory(res.data.results);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <div className="app-container">
      {showDashboard && (
        <div className="dashboard-overlay">
          <div className="dashboard-window">
            <header className="dash-header">
              <div className="dash-title">
                <h2>CENTRAL INTELLIGENCE LOG</h2>
                <span className="count-badge">{history.length} OBJECTS IDENTIFIED</span>
              </div>
              <button className="close-dash" onClick={() => setShowDashboard(false)}>EXIT</button>
            </header>
            <div className="dash-controls">
              <div className="input-group">
                <label>TEMPORAL FILTER</label>
                <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="theme-input" />
              </div>
              <button className="dash-refresh-btn" onClick={fetchHistory}>SYNCHRONIZE DATABASE</button>
            </div>
            <div className="dash-table-container">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>TIME</th>
                    <th>SOURCE</th>
                    <th>IDENTIFIER</th>
                    <th>CONFIDENCE</th>
                    <th>VALIDATION</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, i) => {
                    const dateObj = new Date(item.created_at);
                    return (
                      <tr key={i}>
                        <td>{dateObj.toLocaleDateString()}</td>
                        <td className="time-text">{dateObj.toLocaleTimeString()}</td>
                        <td className="dim-text">{item.video_name || "Stream_01"}</td>
                        <td><span className="plate-pill">{item.top1}</span></td>
                        <td className="confidence-text">{item.confidence || '94.2'}%</td>
                        <td><span className="status-chip">VERIFIED</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <nav className="navbar">
        <div className="nav-left">
          <div className="app-logo">PLATE<span>VISION</span></div>
          <span className="badge">ALPR CORE v4.0</span>
        </div>
        <div className="nav-right">
          <button className="nav-dash-btn" onClick={() => { setShowDashboard(true); fetchHistory(); }}>ACCESS LOGS</button>
          <div className="theme-divider"></div>
          <div className="theme-toggle-container">
            <label className="switch">
              <input type="checkbox" onChange={toggleTheme} checked={theme === "light"} />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </nav>

      <div className="main-content">
        <aside className="frame-explorer">
          <div className="section-header">
            <h3>SEQUENCES</h3>
            <div className="sidebar-actions">
              {frames.length > 0 && <button className="reset-btn" onClick={resetSequence}>CLEAR</button>}
              <label className="upload-icon-btn">+<input type="file" hidden onChange={handleVideoUpload} /></label>
            </div>
          </div>
          <div className="scroll-area">
            {frames.map((frame, index) => (
              <div key={index} className={`frame-card ${selectedFrame === frame ? "active" : ""}`} onClick={() => handleFrameClick(frame)}>
                <img src={`${API_BASE}${frame}`} alt="" />
                <div className="frame-info">OFFSET: {index * 15}ms</div>
              </div>
            ))}
          </div>
        </aside>

        <section className="stage">
          {!selectedFrame && !videoUrl ? (
            <div className="hero-section">
              <div className="hero-tag">NEXT-GEN SURVEILLANCE</div>
              <h1>Neural Plate Intelligence</h1>
              <p className="hero-description">
                Deploying advanced convolutional neural networks to isolate and decrypt vehicle identifiers in real-time. 
                Our ALPR engine ensures high-accuracy detection even in high-speed environments.
              </p>
              <div className="system-specs">
                <div className="spec-item"><span className="spec-label">Detection</span><span className="spec-value">License Plate</span></div>
                <div className="spec-item"><span className="spec-label">Model</span><span className="spec-value">YOLOv8 Custom</span></div>
                <div className="spec-item"><span className="spec-label">OCR</span><span className="spec-value">Text Recognition</span></div>
              </div>
              <div className="hero-actions">
                <label className="hero-upload-btn">INITIALIZE UPLOAD <input type="file" hidden onChange={handleVideoUpload} /></label>
                <button className="secondary-btn" onClick={() => { setShowDashboard(true); fetchHistory(); }}>PREVIOUS LOGS</button>
              </div>
              <div className="status-ticker"><span className="dot pulse"></span> SYSTEM ONLINE: AWAITING ENCODED INPUT...</div>
            </div>
          ) : selectedFrame ? (
            <div className="viewport-container">
              <div className="viewport-header">
                <button className="back-btn" onClick={() => setSelectedFrame(null)}>✕ DISCONNECT VIEW</button>
                <div className="metrics">TARGETS ACQUIRED: {boxes.length}</div>
              </div>
              <div className="image-canvas">
                <div className="canvas-wrapper">
                  <img ref={imgRef} src={`${API_BASE}${selectedFrame}`} className="base-img" id="target-image" alt="Target" />
                  {boxes.map((box, index) => (
                    <div key={index} className={`target-box ${selectedBox === index ? "focus" : ""}`}
                      style={{ 
                        left: `${(box.x1 / (imgRef.current?.naturalWidth || 1)) * 100}%`, 
                        top: `${(box.y1 / (imgRef.current?.naturalHeight || 1)) * 100}%`, 
                        width: `${((box.x2 - box.x1) / (imgRef.current?.naturalWidth || 1)) * 100}%`, 
                        height: `${((box.y2 - box.y1) / (imgRef.current?.naturalHeight || 1)) * 100}%` 
                      }}
                      onClick={() => handleBoxClick(box, index)}
                    ><span className="target-tag">{box.confidence}% MATCH</span></div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="video-viewport">
              <video ref={videoRef} src={videoUrl} controls className="main-video" crossOrigin="anonymous" />
              <div className="video-controls-overlay">
                <div className="speed-selector">
                  <span>RATE:</span>
                  {[0.5, 1, 1.5, 2].map(s => <button key={s} className={playbackSpeed === s ? "active":""} onClick={() => setPlaybackSpeed(s)}>{s}x</button>)}
                </div>
                <button className="cta-btn capture-btn" onClick={handleCapture}>EXTRACT & ANALYZE</button>
              </div>
            </div>
          )}
        </section>

        <aside className="data-panel">
          <div className="panel-section">
            <h3>NEURAL INFERENCE</h3>
            {predictions.map((p, i) => (
              <div key={i} className={`plate-display ${p.isError ? "error-plate" : ""}`}>
                <div className="value">{p.text}</div>
                {!p.isError && <div className="diag-row"><span>PROBABILITY</span><span className="green">{p.confidence}%</span></div>}
              </div>
            ))}
            {!predictions.length && <div className="placeholder-text">Await system input... <br/><small>Select a box for OCR</small></div>}
          </div>
        </aside>
      </div>
      {loading && <div className="global-loader">PROCESSING...</div>}
    </div>
  );
}