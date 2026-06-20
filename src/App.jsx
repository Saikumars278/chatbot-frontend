import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ChatDashboard from "./pages/ChatDashboard";
import Payment from "./pages/Payment";
import { ChatProvider } from "./context/ChatContext";

function App() {
  return (
    <ChatProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/chat" element={<ChatDashboard />} />
          <Route path="/payment" element={<Payment />} />
        </Routes>
      </BrowserRouter>
    </ChatProvider>
  );
}

export default App;