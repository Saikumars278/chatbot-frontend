import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { useChat } from "../context/ChatContext";
import { loadRazorpayScript } from "../utils/razorpay";
import "../Style/ChatDashboard.css";
import { Link } from "react-router-dom";

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

function CodeBlock({ children, language, ...props }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <span className="code-block-lang">{language}</span>
        <button className="code-block-copy-btn" onClick={handleCopy}>
          {copied ? "✓ Copied!" : "📋 Copy code"}
        </button>
      </div>
      <div className="code-container-inner">
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

function ChatDashboard() {
  const { activeChat, addMessageToActiveChat, chatStatus, fetchChatStatus, fetchAuthUser, authUser } = useChat();
  const [input, setInput] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);

  const [plans, setPlans] = useState([]);
  const [modalEmail, setModalEmail] = useState("");
  const [modalPassword, setModalPassword] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    if (chatStatus.limit_reached && chatStatus.is_logged_in && !chatStatus.is_paid) {
      const fetchPlans = async () => {
        try {
          const res = await fetch("http://localhost:8000/api/plans/", { credentials: "include" });
          const data = await res.json();
          if (data.success) {
            setPlans(data.plans);
          }
        } catch (err) {
          console.error("Failed to load plans in modal", err);
        }
      };
      fetchPlans();
    }
  }, [chatStatus.limit_reached, chatStatus.is_logged_in, chatStatus.is_paid]);

  const handleModalLogin = async (e) => {
    e.preventDefault();
    setModalError("");
    setModalLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email: modalEmail, password: modalPassword }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem("user_email", modalEmail);
        localStorage.removeItem("smartbot_guest_messages_count");
        await fetchChatStatus();
        await fetchAuthUser();
        setShowLoginModal(false);
        setInputDisabled(false);
      } else {
        setModalError(data.message || "Invalid email or password");
      }
    } catch (err) {
      setModalError("Failed to connect to server.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalUpgrade = async (planId) => {
    const email = authUser ? authUser.email : (localStorage.getItem("user_email") || "Dhanush");
    try {
      const res = await loadRazorpayScript();
      if (!res) {
        alert("Razorpay SDK failed to load. Are you offline?");
        return;
      }

      const orderResponse = await fetch("http://localhost:8000/api/create-razorpay-order/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan_id: planId }),
      });
      const orderData = await orderResponse.json();

      if (!orderData.success) {
        alert(orderData.message || "Failed to initiate payment");
        return;
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "AI Chatbot",
        description: "Plan Upgrade",
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            const verifyResponse = await fetch("http://localhost:8000/api/verify-razorpay-payment/", {
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
              fetchChatStatus();
              fetchAuthUser();
            } else {
              alert(verifyData.message || "Payment verification failed");
            }
          } catch (err) {
            alert("Error verifying payment");
          }
        },
        prefill: { email: email },
        theme: { color: "#2563eb" },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      alert("Error initiating payment. Please try again.");
    }
  };

  const handleSend = (e) => {
    e.preventDefault();

    if (!input.trim() || (chatStatus.limit_reached && chatStatus.is_logged_in)) return;

    if (!chatStatus.is_logged_in && chatStatus.guest_count >= 2) {
      setShowLoginModal(true);
      setInputDisabled(true);
      return;
    }

    addMessageToActiveChat(input);

    setInput("");
  };

  const messages = activeChat ? activeChat.messages : [];

  return (
    <div className="chat-dashboard">
      <Sidebar />

      <main className="chat-main-area">
        <header className="chat-navbar">
          <div>
            <h2>SmartBot</h2>
            <p>ChatGPT style AI chatbot dashboard</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span className={`status-bar-indicator ${chatStatus.is_paid ? "unlimited" : ""}`}>
              {chatStatus.is_paid ? "✨ Unlimited Access" : `💬 ${chatStatus.remaining_chats} Free Chats Left`}
            </span>
            <Link to="/payment" className="upgrade-button">
              Upgrade
            </Link>
          </div>
        </header>

        <section className="chat-message-area">
          {messages.length === 0 ? (
            <div className="empty-chat">
              <h1>How can I help you today?</h1>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`message-row ${
                  msg.type === "user" ? "user-row" : "ai-row"
                }`}
              >
                {msg.type === "ai" && (
                  <div className="avatar ai-avatar">AI</div>
                )}

                <div className={`message ${msg.type}`}>
                  <ReactMarkdown
                    components={{
                      code({
                        inline,
                        className,
                        children,
                        ...props
                      }) {
                        const match = /language-(\w+)/.exec(
                          className || ""
                        );

                        return !inline && match ? (
                          <CodeBlock
                            language={match[1]}
                            {...props}
                          >
                            {String(children)}
                          </CodeBlock>
                        ) : (
                          <code {...props}>{children}</code>
                        );
                      },
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>

                {msg.type === "user" && (
                  <div className="avatar user-avatar">U</div>
                )}
              </div>
            ))
          )}
        </section>

        <form className="chat-input-wrapper" onSubmit={handleSend}>
          <div className="chat-input-box">
            <input
              type="text"
              placeholder={(chatStatus.limit_reached && chatStatus.is_logged_in) ? "Limit reached. Please subscribe to continue." : "Message SmartBot..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={(chatStatus.limit_reached && chatStatus.is_logged_in) || inputDisabled}
            />

            <button className="send-button" disabled={(chatStatus.limit_reached && chatStatus.is_logged_in) || inputDisabled}>➤</button>
          </div>
        </form>
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Login Required</h3>
            <p>You have reached the guest limit of 2 free messages. Please log in to receive 5 additional free chats.</p>
            
            <form onSubmit={handleModalLogin} className="modal-form">
              {modalError && <div style={{ color: "#ef4444", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>{modalError}</div>}
              
              <label>Email</label>
              <input 
                type="email" 
                placeholder="Enter your email" 
                required 
                value={modalEmail}
                onChange={(e) => setModalEmail(e.target.value)}
              />
              
              <label>Password</label>
              <input 
                type="password" 
                placeholder="Enter your password" 
                required 
                value={modalPassword}
                onChange={(e) => setModalPassword(e.target.value)}
              />
              
              <button type="submit" className="modal-btn primary" disabled={modalLoading}>
                {modalLoading ? "Logging in..." : "Login to Continue"}
              </button>
            </form>
            
            <Link to="/signup" className="modal-btn secondary" style={{ display: "block", textDecoration: "none", textAlign: "center" }}>
              Don't have an account? Sign Up
            </Link>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {chatStatus.limit_reached && chatStatus.is_logged_in && !chatStatus.is_paid && (
        <div className="modal-overlay">
          <div className="modal-content wide">
            <h3>Upgrade to Premium</h3>
            <p>You have exhausted your 5 additional free chats. Subscribe now to unlock unlimited access!</p>
            
            <div className="modal-plans-grid">
              {plans.map((plan) => (
                <div key={plan.id} className={`modal-plan-card ${plan.featured ? "featured" : ""}`}>
                  <div>
                    <h4>{plan.title}</h4>
                    <p className="desc">{plan.desc}</p>
                  </div>
                  <div>
                    <div className="price">{plan.price}</div>
                    <p style={{ fontSize: "11px", color: "#94a3b8", margin: "4px 0 12px" }}>{plan.note}</p>
                    {plan.title === "Plus" ? (
                      <button disabled style={{ opacity: 0.6, cursor: "not-allowed" }}>Current Free Plan</button>
                    ) : (
                      <button onClick={() => handleModalUpgrade(plan.id)}>Subscribe</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <Link to="/chat" className="modal-btn secondary" style={{ display: "inline-block", textDecoration: "none", marginTop: "24px" }} onClick={() => window.location.reload()}>
              Close
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatDashboard;