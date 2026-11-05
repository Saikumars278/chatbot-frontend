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
    // Unlock scrolling for payment page across all devices
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    const rootEl = document.getElementById("root");
    const prevRootOverflow = rootEl ? rootEl.style.overflow : "";
    const prevRootHeight = rootEl ? rootEl.style.height : "";

    document.documentElement.style.overflow = "auto";
    document.documentElement.style.overflowY = "auto";
    document.body.style.overflow = "auto";
    document.body.style.overflowY = "auto";
    if (rootEl) {
      rootEl.style.overflow = "auto";
      rootEl.style.overflowY = "auto";
      rootEl.style.height = "auto";
      rootEl.style.minHeight = "100%";
    }

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.documentElement.style.overflowY = "";
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.overflowY = "";
      if (rootEl) {
        rootEl.style.overflow = prevRootOverflow;
        rootEl.style.overflowY = "";
        rootEl.style.height = prevRootHeight;
        rootEl.style.minHeight = "";
      }
    };
  }, []);

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
        "Save and view chat history"
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
        "Dedicated support"
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

  const getPlanIcon = (title) => {
    if (title === "Plus") {
      return (
        <div className="plan-icon-badge plus-badge">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            <circle cx="9" cy="10" r="1" fill="#60a5fa"></circle>
            <circle cx="12" cy="10" r="1" fill="#60a5fa"></circle>
            <circle cx="15" cy="10" r="1" fill="#60a5fa"></circle>
          </svg>
        </div>
      );
    } else if (title === "Student" || title === "Unlimited Access") {
      return (
        <div className="plan-icon-badge student-badge">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5">
            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="plan-icon-badge business-badge">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
        </div>
      );
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-top-bar">
          <Link to="/chat" className="back-link">
            <span>←</span> Back to Chat
          </Link>
          <div className="flexible-plans-pill">
            <span>⚡ FLEXIBLE PLANS</span>
          </div>
        </div>

        <div className="payment-header-section">
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
                      <span>✩ POPULAR</span>
                    </div>
                  )}

                  <div className="card-header-row">
                    {getPlanIcon(plan.title)}
                    <div className="card-title-group">
                      <h2 className="plan-title">{plan.title}</h2>
                      <p className="plan-description">{plan.desc}</p>
                    </div>
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
                    ) : isFeatured ? (
                      <button
                        onClick={() => handleUpgrade(plan.id)}
                        className="plan-btn btn-featured"
                      >
                        Upgrade to {plan.title} →
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpgrade(plan.id)}
                        className="plan-btn btn-standard"
                      >
                        Upgrade to {plan.title} →
                      </button>
                    )}
                  </div>

                  <div className="card-features-block">
                    <div className="features-header-text">WHAT'S INCLUDED:</div>
                    <ul className="features-list">
                      {features.map((feature, i) => (
                        <li key={i} className="feature-item">
                          <span className="check-bullet">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </span>
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
      </div>
    </div>
  );
}

export default Payment;