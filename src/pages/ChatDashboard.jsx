import { useState } from "react";
import Sidebar from "../Components/Sidebar";
import { useChat } from "../context/ChatContext";
import "../Style/ChatDashboard.css";
import { Link } from "react-router-dom";

function ChatDashboard() {
  const { activeChat, addMessageToActiveChat, createNewChat } = useChat();
  const [input, setInput] = useState("");

  const handleSend = (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    addMessageToActiveChat(input);

    setInput("");
  };

  const messages = activeChat ? activeChat.messages : [];

  return (
    <div className="dashboard-page">
      <Sidebar />

      <main className="chat-main-area">
        <header className="chat-navbar">
          <div>
            <h2>SmartBot</h2>
            <p>ChatGPT style AI chatbot dashboard</p>
          </div>
          <Link to="/payment" className="upgrade-button">
            Upgrade
          </Link>
        </header>

        <section className="chat-message-area">
          {messages.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.7, textAlign: "center" }}>
              <div style={{ fontSize: "50px", marginBottom: "15px" }}>💬</div>
              <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "5px" }}>How can I help you today?</h3>
              <p style={{ fontSize: "14px", color: "#94a3b8" }}>Start typing a message below to begin a conversation.</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`chat-row ${msg.type === "user" ? "right" : "left"}`}
              >
                <div className={`chat-avatar ${msg.type}`}>
                  {msg.type === "user" ? "U" : "AI"}
                </div>

                <div className={`chat-bubble ${msg.type}`}>
                  {msg.text}
                </div>
              </div>
            ))
          )}
        </section>

        <form className="chat-input-wrapper" onSubmit={handleSend}>
          <div className="chat-input-box">
            <input
              type="text"
              placeholder="Message SmartBot..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            <button type="submit" className="send-button">
              ➤
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default ChatDashboard;