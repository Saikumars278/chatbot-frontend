import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { loadRazorpayScript } from "../utils/razorpay";
import { API_BASE_URL } from "../config";
import "../Style/Payment.css";

function Payment() {
  const { authUser, authLoading, fetchChatStatus, fetchAuthUser } = useChat();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !authUser) {
      navigate("/chat");
    }
  }, [authUser, authLoading, navigate]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/plans/`, {
          credentials: "include",
        });
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
    const email = authUser ? authUser.email : (localStorage.getItem("user_email") || "Dhanush");
    try {
      const res = await loadRazorpayScript();
      if (!res) {
        alert("Razorpay SDK failed to load. Are you offline?");
        return;
      }

      // 1. Create order
      const orderResponse = await fetch(`${API_BASE_URL}/create-razorpay-order/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ plan_id: planId }),
      });
      const orderData = await orderResponse.json();

      if (!orderData.success) {
        alert(orderData.message || "Failed to initiate payment");
        return;
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "AI Chatbot",
        description: "Plan Upgrade",
        order_id: orderData.order_id,
        handler: async function (response) {
          // 3. Verify Payment
          try {
            const verifyResponse = await fetch(`${API_BASE_URL}/verify-razorpay-payment/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                plan_id: planId,
              }),
            });
            const verifyData = await verifyResponse.json();
            if (verifyData.success) {
              localStorage.setItem("smartbot_is_paid", "true");
              alert("🎉 Successfully upgraded to Unlimited Access!");
              if (fetchChatStatus) await fetchChatStatus();
              if (fetchAuthUser) await fetchAuthUser();
              navigate("/chat");
            } else {
              alert(verifyData.message || "Payment verification failed");
            }
          } catch (err) {
            alert("Error verifying payment");
          }
        },
        prefill: {
          email: email,
        },
        theme: {
          color: "#2563eb",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      alert("Error initiating payment. Please try again.");
    }
  };

  // Map static features lists based on standard plans
  const getFeatures = (title) => {
    if (title === "Plus") {
      return [
        "5 Free chats on your account",
        "Standard Groq AI intelligence",
        "Standard response speed",
        "Save and view chat history",
        "Community support"
      ];
    } else if (title === "Student" || title === "Unlimited Access") {
      return [
        "Unlimited AI Chat messages",
        "High-speed Groq AI models",
        "Complete chat history retention",
        "Student priority processing",
        "Zero recurring charges"
      ];
    } else if (title === "Business") {
      return [
        "Everything in Student",
        "Team workspace collaboration",
        "Admin controls & analytics",
        "Maximum priority API access",
        "Dedicated 24/7 priority support"
      ];
    } else {
      return [
        "Unlimited AI Chat messages",
        "High-speed Groq AI models",
        "Complete chat history retention",
        "Fast priority processing",
        "Zero recurring charges"
      ];
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-top-nav">
          <Link to="/chat" className="back-link">
            <span>←</span> Back to Chat
          </Link>
        </div>

        <div className="payment-header-section">
          <span className="payment-badge-tag">⚡ FLEXIBLE PLANS</span>
          <h1>Upgrade Your Plan</h1>
          <p className="payment-subtitle">
            Choose the plan that fits your workflows and unlock unlimited AI intelligence.
          </p>
        </div>

        {loading && (
          <div className="payment-loading-state">
            <div className="payment-spinner"></div>
            <p>Loading available plans...</p>
          </div>
        )}
        {error && <div className="payment-error-state">{error}</div>}

        {!loading && !error && (
          <div className="cards-grid">
            {plans.map((plan) => {
              const features = getFeatures(plan.title);
              const isFree = plan.title === "Plus";
              const isFeatured = !!plan.featured;

              return (
                <div
                  className={`pricing-card ${isFeatured ? "featured-card" : ""} ${isFree ? "free-card" : ""}`}
                  key={plan.id}
                >
                  {isFeatured && (
                    <div className="featured-pill-badge">
                      <span>⭐ POPULAR</span>
                    </div>
                  )}

                  <div className="card-header-block">
                    <h2 className="plan-title">{plan.title}</h2>
                    <p className="plan-description">{plan.desc}</p>
                  </div>

                  <div className="card-price-block">
                    <div className="price-display">
                      <span className="price-number">{plan.price}</span>
                      <span className="price-frequency">{plan.note}</span>
                    </div>
                  </div>

                  <div className="card-action-block">
                    {isFree ? (
                      <button className="plan-btn btn-current" disabled>
                        ✓ Current Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpgrade(plan.id)}
                        className={`plan-btn ${isFeatured ? "btn-featured" : "btn-standard"}`}
                      >
                        Upgrade to {plan.title}
                      </button>
                    )}
                  </div>

                  <div className="card-divider-line"></div>

                  <div className="card-features-block">
                    <div className="features-header-text">WHAT'S INCLUDED:</div>
                    <ul className="features-list">
                      {features.map((feature, i) => (
                        <li key={i} className="feature-item">
                          <span className="check-bullet">✓</span>
                          <span className="feature-text">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="payment-footer-note">
          <p>🔒 100% Safe, Secure & Encrypted Checkout powered by Razorpay</p>
        </div>
      </div>
    </div>
  );
}

export default Payment;