import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { API_BASE_URL } from "../config";
import "../Style/Signup.css";

function Signup() {
  const [step, setStep] = useState(1); // 1: Name & Email -> Send OTP, 2: Verify OTP, 3: Mobile & Password -> Create Account
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { fetchAuthUser, fetchChatStatus } = useChat();

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setAlreadyRegistered(false);

    if (!fullName.trim() || !email.trim()) {
      setError("Please enter your full name and email address");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/send-signup-otp/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          fullName,
          email,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(data.message || `6-digit OTP code sent to ${email}`);
        setStep(2);
      } else {
        if (data.already_registered) {
          setAlreadyRegistered(true);
          setError("Account already exists for this email address. Please login.");
        } else {
          setError(data.message || "Failed to send OTP code to email");
        }
      }
    } catch (err) {
      setError("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Email OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp.trim() || otp.length < 6) {
      setError("Please enter the full 6-digit OTP code");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/verify-signup-otp/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          otp,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess("✓ Email verified! Add mobile number & password to complete registration.");
        setStep(3);
      } else {
        setError(data.message || "Invalid OTP code. Please check your email.");
      }
    } catch (err) {
      setError("Failed to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Add Mobile & Password -> Create Account
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!mobile.trim()) {
      setError("Mobile number is required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/signup/`, {
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
          otp,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess("✓ Account created successfully! Launching workspace...");
        localStorage.setItem("user_email", email);
        localStorage.removeItem("smartbot_guest_messages_count");
        if (fetchAuthUser) await fetchAuthUser();
        if (fetchChatStatus) await fetchChatStatus();
        setTimeout(() => {
          navigate("/chat");
        }, 1200);
      } else {
        if (data.already_registered) {
          setAlreadyRegistered(true);
          setError("Account already exists for this email address. Please login.");
        } else {
          setError(data.message || "Failed to create account. Please try again.");
        }
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
        {/* Top Brand & Title */}
        <div className="signup-card-header">
          <div className="brand-badge-box">
            <span className="brand-badge-icon">🤖</span>
            <span className="brand-badge-text">SmartBot AI</span>
          </div>

          {/* Stepper Bar */}
          <div className="stepper-timeline">
            <div className={`step-node ${step >= 1 ? "active" : ""}`}>
              <span className="step-num">1</span>
              <span className="step-label">Email OTP</span>
            </div>
            <div className={`step-line ${step >= 2 ? "active" : ""}`}></div>
            <div className={`step-node ${step >= 2 ? "active" : ""}`}>
              <span className="step-num">2</span>
              <span className="step-label">Verify Code</span>
            </div>
            <div className={`step-line ${step >= 3 ? "active" : ""}`}></div>
            <div className={`step-node ${step >= 3 ? "active" : ""}`}>
              <span className="step-num">3</span>
              <span className="step-label">Account Info</span>
            </div>
          </div>

          <h1 className="header-title">
            {step === 1 && "Create Your Account"}
            {step === 2 && "Verify Email Address"}
            {step === 3 && "Complete Your Registration"}
          </h1>
          <p className="header-subtitle">
            {step === 1 && "Enter your full name and email to receive verification code"}
            {step === 2 && `Enter 6-digit code sent to ${email}`}
            {step === 3 && "Add mobile number & set password to activate account"}
          </p>
        </div>

        {/* Form Body */}
        <div className="signup-card-body">
          {error && (
            <div className="status-alert error">
              <span>⚠️ {error}</span>
              {alreadyRegistered && (
                <div style={{ marginTop: "10px" }}>
                  <Link to="/login" className="alert-action-btn">
                    Go to Login Page →
                  </Link>
                </div>
              )}
            </div>
          )}

          {success && <div className="status-alert success">✓ {success}</div>}

          {/* STEP 1: Enter Name & Email */}
          {step === 1 && (
            <form className="step-form" onSubmit={handleSendOtp}>
              <div className="input-group">
                <label>Full Name</label>
                <div className="field-wrapper">
                  <span className="icon">👤</span>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

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

              <button type="submit" className="primary-cta-btn" disabled={loading}>
                {loading ? "Sending Email OTP..." : "📩 Send Verification OTP →"}
              </button>

              <div className="card-footer-link">
                Already have an account? <Link to="/login">Log in here</Link>
              </div>
            </form>
          )}

          {/* STEP 2: Verify 6-Digit Email OTP */}
          {step === 2 && (
            <form className="step-form" onSubmit={handleVerifyOtp}>
              <div className="input-group">
                <label>6-Digit Email OTP Code</label>
                <div className="field-wrapper">
                  <span className="icon">🔑</span>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    style={{ letterSpacing: "5px", fontSize: "20px", fontWeight: "800" }}
                    autoFocus
                  />
                </div>
                <p className="field-hint">
                  Check your email inbox ({email}) for your 6-digit verification code.
                </p>
              </div>

              <button type="submit" className="primary-cta-btn" disabled={loading}>
                {loading ? "Verifying Code..." : "✓ Verify Email OTP →"}
              </button>

              <div className="action-row-btns">
                <button
                  type="button"
                  className="secondary-ghost-btn"
                  onClick={() => {
                    setStep(1);
                    setError("");
                    setSuccess("");
                  }}
                >
                  ← Change Email
                </button>

                <button
                  type="button"
                  className="secondary-ghost-btn resend"
                  onClick={handleSendOtp}
                  disabled={loading}
                >
                  🔄 Resend OTP
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Add Mobile & Password */}
          {step === 3 && (
            <form className="step-form" onSubmit={handleCreateAccount}>
              <div className="verified-email-badge">
                <span className="check-icon">✓</span> Verified Email: <strong>{email}</strong>
              </div>

              <div className="input-group">
                <label>Mobile Number</label>
                <div className="field-wrapper">
                  <span className="icon">📱</span>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div className="two-col-grid">
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

                <div className="input-group">
                  <label>Confirm Password</label>
                  <div className="field-wrapper">
                    <span className="icon">🔑</span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="primary-cta-btn success-gradient" disabled={loading}>
                {loading ? "Creating Account..." : "🚀 Create Account →"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Signup;