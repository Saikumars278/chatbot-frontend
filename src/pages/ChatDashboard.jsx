import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { useChat } from "../context/ChatContext";
import { loadRazorpayScript } from "../utils/razorpay";
import { API_BASE_URL } from "../config";
import "../Style/ChatDashboard.css";
import { Link } from "react-router-dom";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
        <span className="code-block-lang">{language || "code"}</span>
        <button
          type="button"
          className={`code-block-copy-btn ${copied ? "copied" : ""}`}
          onClick={handleCopy}
          title="Copy code to clipboard"
          aria-label="Copy code"
        >
          {copied ? "✓ Copied!" : "📋 Copy"}
        </button>
      </div>
      <div className="code-container-inner">
        <SyntaxHighlighter
          language={language || "text"}
          style={oneDark}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: "16px",
            background: "#0b0f19",
            fontSize: "13px",
            lineHeight: "1.5",
            borderRadius: "0 0 12px 12px",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            maxWidth: "100%",
            boxSizing: "border-box"
          }}
          codeTagProps={{
            style: {
              fontFamily: "'Fira Code', 'Cascadia Code', Consolas, Monaco, monospace",
              whiteSpace: "pre",
              wordBreak: "normal"
            }
          }}
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);
  const messagesEndRef = useRef(null);

  const [plans, setPlans] = useState([]);
  const [modalEmail, setModalEmail] = useState("");
  const [modalPassword, setModalPassword] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    if (chatStatus.limit_reached && chatStatus.is_logged_in && !chatStatus.is_paid) {
      const fetchPlans = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/plans/`, { credentials: "include" });
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
      const response = await fetch(`${API_BASE_URL}/login/`, {
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

      const orderResponse = await fetch(`${API_BASE_URL}/create-razorpay-order/`, {
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

    if (!input.trim()) return;

    if (!chatStatus.is_logged_in && (chatStatus.guest_count >= 5 || chatStatus.limit_reached)) {
      setShowLoginModal(true);
      setInputDisabled(true);
      return;
    }

    addMessageToActiveChat(input);
    setInput("");
  };

  const messages = activeChat ? activeChat.messages : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-dashboard">
      <Sidebar open={mobileSidebarOpen} setOpen={setMobileSidebarOpen} />

      <main className="chat-main-area">
        <header className="chat-navbar">
          <div className="chat-navbar-left">
            <button
              type="button"
              className="mobile-sidebar-toggle"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Toggle history menu"
              title="History Menu"
            >
              ☰
            </button>
            <div className="brand-info">
              <h2>SmartBot</h2>
              <p className="navbar-subtitle">ChatGPT style AI chatbot dashboard</p>
            </div>
          </div>

          <div className="chat-navbar-right">
            {chatStatus.is_logged_in && (
              <span className="user-name-badge" title={authUser?.name || authUser?.username || "User"}>
                👤 {(() => {
                  const raw = authUser ? (authUser.name || authUser.username) : (localStorage.getItem("user_email")?.split("@")[0] || "User");
                  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "User";
                })()}
              </span>
            )}
            <span className={`status-bar-indicator ${chatStatus.is_logged_in ? "unlimited" : ""}`}>
              {chatStatus.is_logged_in
                ? "✨ Unlimited"
                : `💬 ${chatStatus.remaining_chats} Free`}
            </span>
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
                <div className={`message ${msg.type}`}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({
                        inline,
                        className,
                        children,
                        ...props
                      }) {
                        const match = /language-(\w+)/.exec(className || "");
                        const isBlockCode = !inline && (match || String(children).includes("\n"));

                        return isBlockCode ? (
                          <CodeBlock
                            language={match ? match[1] : "code"}
                            {...props}
                          >
                            {String(children)}
                          </CodeBlock>
                        ) : (
                          <code className="inline-code" {...props}>
                            {children}
                          </code>
                        );
                      },
                      table({ children, ...props }) {
                        return (
                          <div className="markdown-table-wrapper">
                            <table {...props}>{children}</table>
                          </div>
                        );
                      },
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </section>

        <form className="chat-input-wrapper" onSubmit={handleSend}>
          <div className="chat-input-box">
            <input
              type="text"
              placeholder={(!chatStatus.is_logged_in && chatStatus.limit_reached) ? "Limit reached. Log in to continue." : "Message SmartBot..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!chatStatus.is_logged_in && chatStatus.limit_reached}
            />

            <button className="send-button" disabled={!chatStatus.is_logged_in && chatStatus.limit_reached}>➤</button>
          </div>
        </form>
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Login Required</h3>
            <p>You have reached the guest limit of 5 free prompts. Please log in or sign up to unlock ✨ Unlimited Access!</p>
            
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