import { useState } from "react";
import Sidebar from "../Components/Sidebar";
import "../Style/ChatDashboard.css";
import { Link } from "react-router-dom";

function ChatDashboard() {
  const [messages, setMessages] = useState([
    {
      type: "bot",
      text: "Hello! I am SmartBot. How can I help you today?",
    },
  ]);

  const [input, setInput] = useState("");

  const handleSend = (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    setMessages([
      ...messages,
      {
        type: "user",
        text: input,
      },
      {
        type: "bot",
        text: "Thanks for your message. I am processing your request.",
      },
    ]);

    setInput("");
  };

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
          {messages.map((msg, index) => (
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
          ))}
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