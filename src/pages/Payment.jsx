import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../Style/Payment.css";

function Payment() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/plans/");
        const data = await response.json();
        if (data.success) {
          setPlans(data.plans);
        } else {
          setError("Failed to load plans from backend");
        }
      } catch (err) {
        setError("Error connecting to server. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleUpgrade = async (planId) => {
    const email = localStorage.getItem("user_email") || "Dhanush";
    try {
      const response = await fetch("http://127.0.0.1:8000/api/upgrade-plan/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan_id: planId,
          user_name: email,
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`Successfully upgraded to ${data.subscription.plan}!`);
      } else {
        alert(data.message || "Failed to upgrade plan");
      }
    } catch (err) {
      alert("Error upgrading plan. Please try again.");
    }
  };

  // Map static features lists based on standard plans
  const getFeatures = (title) => {
    if (title === "Plus") {
      return ["Advanced models", "Image creation", "Codex coding agent", "Projects and custom GPTs"];
    } else if (title === "Business") {
      return ["Team workspace", "Admin controls", "Billing management", "Company knowledge"];
    } else {
      return ["5x more usage", "Maximum Codex access", "Deep research", "Fast image creation"];
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-container">
        <Link to="/chat" className="back-link">
          ← Back
        </Link>

        <h1>Upgrade Your Plan</h1>
        <p className="payment-subtitle">Choose the plan that fits your workflows and team collaboration.</p>

        {loading && <div style={{ textAlign: "center", color: "#ffffff", fontSize: "16px", marginTop: "40px" }}>Loading plans...</div>}
        {error && <div style={{ textAlign: "center", color: "#ef4444", fontSize: "16px", marginTop: "40px" }}>{error}</div>}

        {!loading && !error && (
          <div className="cards">
            {plans.map((plan, index) => {
              const features = getFeatures(plan.title);
              const isFree = plan.title === "Plus";
              return (
                <div
                  className={`card ${plan.featured ? "featured-card" : ""}`}
                  key={plan.id}
                >
                  {plan.featured && <span className="badge">Popular</span>}

                  <h2>{plan.title}</h2>
                  <p className="desc">{plan.desc}</p>

                  <h3>{plan.price}</h3>
                  <p className="note">{plan.note}</p>

                  {isFree ? (
                    <button className="btn disabled" disabled>
                      Current Plan
                    </button>
                  ) : (
                    <button onClick={() => handleUpgrade(plan.id)} className="btn">
                      Upgrade to {plan.title}
                    </button>
                  )}

                  <ul>
                    {features.map((feature, i) => (
                      <li key={i}>{feature}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Payment;