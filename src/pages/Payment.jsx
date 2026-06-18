import { Link } from "react-router-dom";
import "../Style/Payment.css";

function Payment() {
  const plans = [
    {
      title: "Plus",
      price: "₹0",
      note: "INR / month",
      desc: "More access to advanced intelligence",
      button: "Current Plan",
      disabled: true,
      features: [
        "Advanced models",
        "Image creation",
        "Codex coding agent",
        "Projects and custom GPTs",
      ],
    },
    {
      title: "Business",
      price: "₹1,800",
      note: "/ user / month",
      desc: "Best for teams and companies",
      button: "Add Business",
      featured: true,
      path: "/checkout/business",
      features: [
        "Team workspace",
        "Admin controls",
        "Billing management",
        "Company knowledge",
      ],
    },
    {
      title: "Pro",
      price: "₹10,699",
      note: "INR / month",
      desc: "Maximize your productivity",
      button: "Upgrade to Pro",
      path: "/checkout/pro",
      features: [
        "5x more usage",
        "Maximum Codex access",
        "Deep research",
        "Fast image creation",
      ],
    },
  ];

  return (
    <div className="payment-page">
      <div className="payment-container">
        <Link to="/chat" className="back-link">
          ← Back
        </Link>

        <h1>Upgrade Your Plan</h1>

        <div className="cards">
          {plans.map((plan, index) => (
            <div
              className={`card ${plan.featured ? "featured-card" : ""}`}
              key={index}
            >
              {plan.featured && <span className="badge">Popular</span>}

              <h2>{plan.title}</h2>
              <p className="desc">{plan.desc}</p>

              <h3>{plan.price}</h3>
              <p className="note">{plan.note}</p>

              {plan.disabled ? (
                <button className="btn disabled" disabled>
                  {plan.button}
                </button>
              ) : (
                <Link to={plan.path} className="btn">
                  {plan.button}
                </Link>
              )}

              <ul>
                {plan.features.map((feature, i) => (
                  <li key={i}>✓ {feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Payment;