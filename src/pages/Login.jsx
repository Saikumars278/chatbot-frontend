import { Link } from "react-router-dom";
import "../Style/Login.css";

function Login() {
  const handleLogin = (e) => {
    e.preventDefault();
    alert("Login successful");
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

        <label>Email</label>
        <input type="email" placeholder="Enter email" required />

        <label>Password</label>
        <input type="password" placeholder="Enter password" required />

        <button type="submit">Login</button>

        <p className="switch-text">
          Don&apos;t have an account? <Link to="/signup">Signup</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;