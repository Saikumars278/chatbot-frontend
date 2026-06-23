import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import "../Style/Login.css";

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
    <div className="auth-page">
      <div className="auth-left">
        <h1>Welcome Back</h1>
        <p>Login to continue your chatbot conversation workflow.</p>

        <div className="step-box">1. Enter email and password</div>
        <div className="step-box">2. Verify your account</div>
        <div className="step-box">3. Open chatbot dashboard</div>
      </div>

      <form className="auth-card" onSubmit={handleLogin}>
        <h2>Login</h2>
        <p className="sub-text">Sign in to your account</p>

        {error && <div style={{ color: "#ef4444", marginBottom: "15px", fontWeight: "600", fontSize: "14px" }}>{error}</div>}

        <label>Email</label>
        <input 
          type="email" 
          placeholder="Enter email" 
          required 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password</label>
        <input 
          type="password" 
          placeholder="Enter password" 
          required 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="switch-text">
          Don&apos;t have an account? <Link to="/signup">Signup</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;