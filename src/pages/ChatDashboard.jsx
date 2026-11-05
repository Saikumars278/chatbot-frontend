import { useState, useEffect, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useChat } from "../context/ChatContext";
import { loadRazorpayScript } from "../utils/razorpay";
import { API_BASE_URL } from "../config";
import "../Style/ChatDashboard.css";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const CodeBlock = memo(function CodeBlock({ children, language, ...props }) {
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
});

const MessageItem = memo(function MessageItem({ msg }) {
  return (
    <div
      className={`message-row ${
        msg.type === "user" ? "user-row" : "ai-row"
      }`}
    >
      <div className={`message ${msg.type}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ inline, className, children, ...props }) {
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
  );
});

function ChatDashboard() {
  const navigate = useNavigate();
  const {
    activeChat,
    addMessageToActiveChat,
    chatStatus = {},
    fetchChatStatus,
    theme,
    toggleTheme
  } = useChat();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const isPaid = !!chatStatus?.is_paid;
  const isLoggedIn = !!chatStatus?.is_logged_in;
  const isGuestLimitReached = !isPaid && !isLoggedIn && (
    chatStatus?.remaining_chats === 0 ||
    chatStatus?.limit_reached ||
    chatStatus?.login_required ||
    (typeof chatStatus?.guest_count === "number" && chatStatus.guest_count >= 3)
  );
  const isUserLimitReached = !isPaid && isLoggedIn && (
    chatStatus?.remaining_chats === 0 ||
    chatStatus?.limit_reached ||
    chatStatus?.payment_required ||
    (typeof chatStatus?.user_count === "number" && chatStatus.user_count >= 5)
  );

  // Auto trigger modals when thresholds are hit
  useEffect(() => {
    if (isPaid) {
      setShowLoginModal(false);
      setShowPaymentModal(false);
    } else if (isGuestLimitReached) {
      setShowLoginModal(true);
      setShowPaymentModal(false);
    } else if (isUserLimitReached) {
      setShowPaymentModal(true);
      setShowLoginModal(false);
    }
  }, [isPaid, isGuestLimitReached, isUserLimitReached]);

  const handleUpgradeTo299 = async () => {
    setPaymentLoading(true);
    try {
      const res = await loadRazorpayScript();
      if (!res) {
        alert("Razorpay SDK failed to load. Please check your internet connection.");
        setPaymentLoading(false);
        return;
      }

      const orderResponse = await fetch(`${API_BASE_URL}/create-razorpay-order/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: 299, plan_name: "Unlimited Access" }),
      });
      const orderData = await orderResponse.json();

      if (!orderData.success) {
        alert(orderData.message || "Failed to initiate payment");
        setPaymentLoading(false);
        return;
      }

      const options = {
        key: orderData.key_id || orderData.key,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "SmartBot AI",
        description: "Unlimited Access Plan (₹299)",
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
              }),
            });
            const verifyData = await verifyResponse.json();
            if (verifyData.success) {
              localStorage.setItem("smartbot_is_paid", "true");
              alert("🎉 Payment successful! You now have Unlimited Access.");
              await fetchChatStatus();
              setShowPaymentModal(false);
            } else {
              alert(verifyData.message || "Payment verification failed");
            }
          } catch (err) {
            alert("Error verifying payment");
          } finally {
            setPaymentLoading(false);
          }
        },
        theme: { color: "#2563eb" },
        modal: {
          ondismiss: function () {
            setPaymentLoading(false);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      alert("Error initiating payment. Please try again.");
      setPaymentLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    if (isGuestLimitReached) {
      setShowLoginModal(true);
      return;
    }

    if (isUserLimitReached) {
      setShowPaymentModal(true);
      return;
    }

    const currentText = input;
    setInput("");
    const res = await addMessageToActiveChat(currentText);
    if (res && !res.success) {
      if (res.login_required) {
        setShowLoginModal(true);
      } else if (res.payment_required) {
        setShowPaymentModal(true);
      }
    }
  };

  const messages = activeChat ? (activeChat.messages || []) : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isInputDisabled = isGuestLimitReached || isUserLimitReached;

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
              <p className="navbar-subtitle">AI Assistant</p>
            </div>
          </div>

          <div className="chat-navbar-right">
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
            </button>

            {/* Access status indicator */}
            {isPaid ? (
              <span className="status-bar-indicator unlimited">
                ✨ Unlimited Access
              </span>
            ) : isLoggedIn ? (
              <span
                className={`status-bar-indicator ${chatStatus?.remaining_chats === 0 ? "limit-alert" : ""}`}
                onClick={() => { if (chatStatus?.remaining_chats === 0) setShowPaymentModal(true); }}
                title={chatStatus?.remaining_chats === 0 ? "Click to Unlock Unlimited Access" : "Free chats remaining on your account"}
                style={{ cursor: chatStatus?.remaining_chats === 0 ? "pointer" : "default" }}
              >
                💬 {chatStatus?.remaining_chats !== undefined ? chatStatus.remaining_chats : 5} Free {chatStatus?.remaining_chats === 1 ? "Chat" : "Chats"}
              </span>
            ) : (
              <span
                className={`status-bar-indicator ${chatStatus?.remaining_chats === 0 ? "limit-alert" : ""}`}
                onClick={() => { if (chatStatus?.remaining_chats === 0) setShowLoginModal(true); }}
                title={chatStatus?.remaining_chats === 0 ? "Click to Sign Up / Log In" : "Free guest chats remaining"}
                style={{ cursor: chatStatus?.remaining_chats === 0 ? "pointer" : "default" }}
              >
                💬 {chatStatus?.remaining_chats !== undefined ? chatStatus.remaining_chats : 3} Free {chatStatus?.remaining_chats === 1 ? "Chat" : "Chats"}
              </span>
            )}
          </div>
        </header>

        <section className="chat-message-area">
          {messages.length === 0 ? (
            <div className="empty-chat">
              <h1>How can I help you today?</h1>
              {isPaid ? (
                <p style={{ color: "#34d399", fontSize: "14px", marginTop: "8px" }}>
                  ✨ Unlimited Access active. Ask anything to begin!
                </p>
              ) : isLoggedIn ? (
                <p style={{ color: "#94a3b8", fontSize: "14px", marginTop: "8px" }}>
                  You have <strong>{chatStatus?.remaining_chats !== undefined ? chatStatus.remaining_chats : 5} free chats</strong> remaining on your account.
                </p>
              ) : (
                <p style={{ color: "#94a3b8", fontSize: "14px", marginTop: "8px" }}>
                  You have <strong>{chatStatus?.remaining_chats !== undefined ? chatStatus.remaining_chats : 3} free guest chats</strong>. Ask anything to begin!
                </p>
              )}
            </div>
          ) : (
            messages.map((msg, index) => (
              <MessageItem key={index} msg={msg} />
            ))
          )}
          <div ref={messagesEndRef} />
        </section>

        <form className="chat-input-wrapper" onSubmit={handleSend}>
          <div className="chat-input-box">
            <input
              type="text"
              placeholder={
                isGuestLimitReached
                  ? "Guest limit reached (3 chats). Sign up or log in for 5 more free chats."
                  : isUserLimitReached
                  ? "Free limit reached (5 chats). Upgrade to Unlimited Access for ₹299."
                  : "Message SmartBot..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isInputDisabled}
              onClick={() => {
                if (isGuestLimitReached) setShowLoginModal(true);
                else if (isUserLimitReached) setShowPaymentModal(true);
              }}
            />

            <button
              className="send-button"
              type="submit"
              disabled={isInputDisabled}
              title={
                isGuestLimitReached
                  ? "Sign up or log in to continue"
                  : isUserLimitReached
                  ? "Upgrade to ₹299 Unlimited Access"
                  : "Send message"
              }
            >
              ➤
            </button>
          </div>
        </form>
      </main>

      {/* 1. Login / Sign Up Modal for Guests after 3 chats */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-badge-tag">🔒 3 FREE GUEST CHATS USED</div>
            <h3>Create a Free Account</h3>
            <p>
              You've used your <strong>3 free guest chats</strong>! Sign up or log in now to unlock <strong>5 more free chats</strong> on your account.
            </p>

            <div className="auth-modal-perks">
              <div className="perk-item">
                <span className="perk-icon">🎁</span>
                <span><strong>5 Free Chats</strong> added to your account</span>
              </div>
              <div className="perk-item">
                <span className="perk-icon">💾</span>
                <span>Save and restore all chat histories</span>
              </div>
              <div className="perk-item">
                <span className="perk-icon">⚡</span>
                <span>Access high-speed Groq AI models</span>
              </div>
            </div>

            <div className="modal-actions-column">
              <button
                type="button"
                className="modal-btn primary"
                onClick={() => navigate("/signup")}
              >
                ✨ Sign Up Free (Get 5 Chats) →
              </button>
              <button
                type="button"
                className="modal-btn secondary"
                onClick={() => navigate("/login")}
              >
                🔑 Log In to Existing Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ₹299 Payment Modal for Logged-In Users after 5 chats */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content premium-pay-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-badge-tag gold">⚡ UNLIMITED ACCESS</div>
            <h3>Upgrade to Unlimited Access</h3>
            <p>
              You've used your <strong>5 free chats</strong>. Pay just <strong>₹299</strong> to unlock unlimited AI chats forever without any limits!
            </p>

            <div className="price-highlight-box">
              <div className="price-tag-big">₹299</div>
              <div className="price-subtitle">One-Time Payment • Instant Lifetime Access</div>
            </div>

            <ul className="modal-features-list">
              <li>⚡ <strong>Unlimited AI Messages</strong> & instant replies</li>
              <li>🚀 <strong>High-Speed Groq AI</strong> intelligence models</li>
              <li>💬 <strong>Permanent Chat History</strong> & session retention</li>
              <li>🛡️ <strong>Zero recurring charges</strong> (Single one-time payment)</li>
            </ul>

            <button
              type="button"
              className="modal-btn primary pay-299-btn"
              onClick={handleUpgradeTo299}
              disabled={paymentLoading}
            >
              {paymentLoading ? "Connecting to Razorpay..." : "💳 Pay ₹299 with Razorpay"}
            </button>

            <p style={{ fontSize: "12px", color: "#64748b", margin: "14px 0 0" }}>
              🔒 100% Safe, Secure & Encrypted Checkout via Razorpay
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatDashboard;
