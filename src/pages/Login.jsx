import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import "../Style/Signup.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { fetchAuthUser, fetchChatStatus } = useChat();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem("user_email", email);
        localStorage.removeItem("smartbot_guest_messages_count");
        await fetchAuthUser();
        await fetchChatStatus();
        navigate("/chat");
      } else {
        setError(data.message || "Invalid email or password");
      }
    } catch (err) {
      setError("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modern-signup-container">
      {/* Background Ambient Orbs */}
      <div className="ambient-orb orb-1"></div>
      <div className="ambient-orb orb-2"></div>
      <div className="ambient-orb orb-3"></div>

      <div className="signup-glass-card">
        <div className="signup-card-header">
          <div className="brand-badge-box">
            <span className="brand-badge-icon">🤖</span>
            <span className="brand-badge-text">SmartBot AI</span>
          </div>

          <h1 className="header-title">Welcome Back</h1>
          <p className="header-subtitle">Log in to your SmartBot AI Workspace</p>
        </div>

        <div className="signup-card-body">
          <form className="step-form" onSubmit={handleLogin}>
            {error && <div className="status-alert error">⚠️ {error}</div>}

            <div className="input-group">
              <label>Email Address</label>
              <div className="field-wrapper">
                <span className="icon">✉️</span>
                <input
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="field-wrapper">
                <span className="icon">🔒</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="primary-cta-btn" disabled={loading}>
              {loading ? "Logging in..." : "Log In to Workspace →"}
            </button>

            <div className="card-footer-link">
              Don&apos;t have an account? <Link to="/signup">Sign up here</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;