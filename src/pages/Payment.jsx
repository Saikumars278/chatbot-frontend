import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { loadRazorpayScript } from "../utils/razorpay";
import { API_BASE_URL } from "../config";
import "../Style/Payment.css";

function Payment() {
  const { authUser, authLoading } = useChat();
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
              alert(`Successfully upgraded to ${verifyData.subscription.plan}!`);
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