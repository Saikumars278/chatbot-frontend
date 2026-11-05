import { Component } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ChatDashboard from "./pages/ChatDashboard";
import Payment from "./pages/Payment";
import { ChatProvider } from "./context/ChatContext";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("SmartBot React Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#020617",
          color: "#ffffff",
          fontFamily: "Inter, sans-serif",
          padding: "20px",
          textAlign: "center"
        }}>
          <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>🤖 SmartBot AI Workspace</h1>
          <p style={{ color: "#94a3b8", maxWidth: "450px", marginBottom: "20px" }}>
            {this.state.error?.message || "An unexpected error occurred while loading the workspace."}
          </p>
          <button
            onClick={() => {
              localStorage.removeItem("smartbot_active_chat_id");
              window.location.href = "/chat";
            }}
            style={{
              padding: "12px 24px",
              borderRadius: "12px",
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            🔄 Reload Chat Workspace
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <ChatProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/chat" element={<ChatDashboard />} />
            <Route path="/payment" element={<Payment />} />
          </Routes>
        </BrowserRouter>
      </ChatProvider>
    </ErrorBoundary>
  );
}

export default App;
