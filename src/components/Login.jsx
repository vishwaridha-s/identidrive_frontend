import { useState } from "react";
import axios from "axios";

export default function Login({ onLogin, onSwitchToSignup, apiBase }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${apiBase}/api/login/`, { username, password });
      onLogin(res.data.username);
    } catch (err) {
      if (err.response?.status === 404 && err.response?.data?.redirect_signup) {
        alert("User not found. Redirecting to Signup.");
        onSwitchToSignup();
      } else {
        setError(err.response?.data?.error || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <div className="app-logo">PLATE<span>VISION</span></div>
        <h2>SECURE ACCESS</h2>
        <p className="auth-subtitle">ENTER CREDENTIALS TO INITIALIZE INTERFACE</p>
        
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
            {loading ? "AUTHENTICATING..." : "AUTHORIZE ACCESS"}
          </button>
        </form>
        
        <div className="auth-footer">
          <span>NEW OPERATOR?</span>
          <button className="link-btn" onClick={onSwitchToSignup}>SIGNUP</button>
        </div>
      </div>
    </div>
  );
}
