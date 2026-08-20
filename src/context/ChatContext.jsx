import { createContext, useContext, useState, useEffect } from "react";
import { API_BASE_URL as API } from "../config";

const ChatContext = createContext();


export function ChatProvider({ children }) {
  // ── Chat list ────────────────────────────────────────────────────────────
  const [chats, setChats] = useState(() => {
    if (!localStorage.getItem("smartbot_chats_cleaned")) {
      localStorage.removeItem("smartbot_chats");
      localStorage.setItem("smartbot_chats_cleaned", "true");
    }
    const saved = localStorage.getItem("smartbot_chats");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeChatId, setActiveChatId] = useState(() => {
    const savedActive = localStorage.getItem("smartbot_active_chat_id");
    return savedActive || null;
  });

  useEffect(() => {
    localStorage.setItem("smartbot_chats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    if (activeChatId) {
      localStorage.setItem("smartbot_active_chat_id", activeChatId);
    } else {
      localStorage.removeItem("smartbot_active_chat_id");
    }
  }, [activeChatId]);

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0] || null;

  const createNewChat = () => {
    // Prevent duplicate New Chat sessions: check if an empty/unstarted chat already exists
    const emptyChat = chats.find(
      (c) => (c.title === "New Chat" || c.title === "Guest Chat") && !c.messages.some((m) => m.type === "user")
    );

    if (emptyChat) {
      setActiveChatId(emptyChat.id);
      return;
    }

    const newChatId = "chat-" + Date.now();
    const newChat = {
      id: newChatId,
      title: "New Chat",
      messages: [
        { type: "bot", text: "Hello! Started a new chat. How can I help you?" }
      ]
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newChatId);
  };

  const deleteChat = (id) => {
    const updatedChats = chats.filter((c) => c.id !== id);
    setChats(updatedChats);
    if (activeChatId === id) {
      setActiveChatId(updatedChats[0]?.id || null);
    }
  };

  const selectChat = (id) => {
    setActiveChatId(id);
  };

  const clearAllChats = () => {
    setChats([]);
    setActiveChatId(null);
    localStorage.removeItem("smartbot_chats");
    localStorage.removeItem("smartbot_active_chat_id");
  };

  // ── Auth user ────────────────────────────────────────────────────────────
  const [authUser, setAuthUser] = useState(null);   // { name, email, plan, avatar }
  const [authLoading, setAuthLoading] = useState(true);

  const fetchAuthUser = async () => {
    try {
      const res = await fetch(`${API}/user-profile/`, { credentials: "include" });
      const data = await res.json();
      setAuthUser(data.success ? data.user : null);
    } catch {
      setAuthUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => { fetchAuthUser(); }, []);

  // ── Chat / access status ─────────────────────────────────────────────────
  const [chatStatus, setChatStatus] = useState({
    remaining_chats: 2,
    limit_reached: false,
    is_logged_in: false,
    is_paid: false,
    status_text: "2 remaining free chats"
  });

  const fetchChatStatus = async () => {
    try {
      const res = await fetch(`${API}/chat-status/`, {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        if (data.is_logged_in) {
          localStorage.removeItem("smartbot_guest_messages_count");
          setChatStatus(data);
        } else {
          const localCount = parseInt(localStorage.getItem("smartbot_guest_messages_count") || "0", 10);
          const effectiveCount = Math.max(data.guest_count || 0, localCount);
          const remaining = Math.max(0, 2 - effectiveCount);
          setChatStatus({
            ...data,
            guest_count: effectiveCount,
            remaining_chats: remaining,
            limit_reached: effectiveCount >= 2,
            status_text: remaining > 0 ? `${remaining} remaining free chats` : "Login required"
          });
        }
      }
    } catch (err) {
      console.error("Error fetching chat status:", err);
    }
  };

  useEffect(() => {
    fetchChatStatus();
  }, []);

  const addMessageToActiveChat = async (userText) => {
    let currentActiveId = activeChatId;
    
    // Create chat on the fly if none exists
    if (!currentActiveId) {
      const newChatId = "chat-" + Date.now();
      const newChat = {
        id: newChatId,
        title: userText.length > 25 ? userText.substring(0, 25) + "..." : userText,
        messages: []
      };
      setChats([newChat, ...chats]);
      setActiveChatId(newChatId);
      currentActiveId = newChatId;
    }

    // 1. Add User message instantly in local UI state
    setChats((prevChats) =>
      prevChats.map((c) => {
        if (c.id === currentActiveId) {
          const updatedMessages = [
            ...c.messages,
            { type: "user", text: userText }
          ];
          
          let title = c.title;
          if (c.title === "New Chat" && userText) {
            title = userText.length > 25 ? userText.substring(0, 25) + "..." : userText;
          }

          return {
            ...c,
            title,
            messages: updatedMessages
          };
        }
        return c;
      })
    );

    // 2. Fetch reply from backend server api
    try {
      const response = await fetch(`${API}/messages/send/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ message: userText })
      });
      const data = await response.json();
      if (data.success && data.bot_message) {
        if (!chatStatus.is_logged_in) {
          const currentCount = parseInt(localStorage.getItem("smartbot_guest_messages_count") || "0", 10);
          localStorage.setItem("smartbot_guest_messages_count", (currentCount + 1).toString());
        }
        setChats((prevChats) =>
          prevChats.map((c) => {
            if (c.id === currentActiveId) {
              return {
                ...c,
                messages: [
                  ...c.messages,
                  { type: "bot", text: data.bot_message.text }
                ]
              };
            }
            return c;
          })
        );
      }
    } catch (err) {
      console.error("Error communicating with backend chatbot API:", err);
      // Fallback
      setChats((prevChats) =>
        prevChats.map((c) => {
          if (c.id === currentActiveId) {
            return {
              ...c,
              messages: [
                ...c.messages,
                { type: "bot", text: "Error: Could not connect to Django API backend." }
              ]
            };
          }
          return c;
        })
      );
    } finally {
      fetchChatStatus();
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChat,
        activeChatId,
        createNewChat,
        deleteChat,
        selectChat,
        clearAllChats,
        addMessageToActiveChat,
        // auth
        authUser,
        authLoading,
        fetchAuthUser,
        // limits
        chatStatus,
        fetchChatStatus
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
