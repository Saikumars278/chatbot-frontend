import { Link } from "react-router-dom";
import "../Style/Signup.css";

function Signup() {
  const handleSignup = (e) => {
    e.preventDefault();
    alert("Signup successful");
  };

  return (
    <div className="signup-page">
      <form className="signup-card" onSubmit={handleSignup}>
        <h2>Create Account</h2>
        <p className="sub-text">Signup to start chatbot workflow</p>

        <label>Full Name</label>
        <input type="text" placeholder="Enter full name" required />

        <label>Email</label>
        <input type="email" placeholder="Enter email" required />

        <label>Mobile Number</label>
        <input type="tel" placeholder="Enter mobile number" required />

        <label>Password</label>
        <input type="password" placeholder="Create password" required />

        <label>Confirm Password</label>
        <input type="password" placeholder="Confirm password" required />

        <button type="submit">Signup</button>

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