import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../Style/Signup.css";

function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/signup/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          fullName,
          email,
          mobile,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess("Account created successfully! Redirecting...");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        setError(data.message || "Failed to create account");
      }
    } catch (err) {
      setError("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <form className="signup-card" onSubmit={handleSignup}>
        <h2>Create Account</h2>
        <p className="sub-text">Signup to start chatbot workflow</p>

        {error && <div style={{ color: "#ef4444", marginBottom: "15px", fontWeight: "600", fontSize: "14px" }}>{error}</div>}
        {success && <div style={{ color: "#10b981", marginBottom: "15px", fontWeight: "600", fontSize: "14px" }}>{success}</div>}

        <label>Full Name</label>
        <input 
          type="text" 
          placeholder="Enter full name" 
          required 
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <label>Email</label>
        <input 
          type="email" 
          placeholder="Enter email" 
          required 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Mobile Number</label>
        <input 
          type="tel" 
          placeholder="Enter mobile number" 
          required 
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />

        <label>Password</label>
        <input 
          type="password" 
          placeholder="Create password" 
          required 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label>Confirm Password</label>
        <input 
          type="password" 
          placeholder="Confirm password" 
          required 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Signup"}
        </button>

        <p className="switch-text">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>

      <div className="signup-right">
        <h1>Start SmartBot</h1>
        <p>Create your account and open the chatbot dashboard.</p>

        <div className="workflow">
          <div>
            <span>01</span>
            <p>Create account</p>
          </div>
          <div>
            <span>02</span>
            <p>Save user details</p>
          </div>
          <div>
            <span>03</span>
            <p>Open chatbot</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;