import { useState } from "react";
import axios from "axios";

export default function Signup({ onSwitchToLogin, apiBase }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await axios.post(`${apiBase}/api/signup/`, { username, password, email });
      alert("Account created successfully. Please login.");
      onSwitchToLogin();
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <div className="app-logo">PLATE<span>VISION</span></div>
        <h2>REGISTER OPERATOR</h2>
        <p className="auth-subtitle">CREATE NEW SYSTEM IDENTITY</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>OPERATOR IDENTITY</label>
            <input 
              type="text" 
              placeholder="Username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="theme-input" 
              required 
            />
          </div>
          <div className="input-group">
            <label>TEMPORAL EMAIL (OPTIONAL)</label>
            <input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="theme-input" 
            />
          </div>
          <div className="input-group">
            <label>ACCESS KEY</label>
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="theme-input" 
              required 
            />
          </div>
          
          {error && <div className="auth-error">{error}</div>}
          
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "PROCESSING..." : "CREATE IDENTITY"}
          </button>
        </form>
        
        <div className="auth-footer">
          <span>ALREADY REGISTERED?</span>
          <button className="link-btn" onClick={onSwitchToLogin}>LOGIN</button>
        </div>
      </div>
    </div>
  );
}
