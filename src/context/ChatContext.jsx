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
        { type: "bot", text: "Hello! Started a new chat. How can I help you today?" }
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
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const fetchAuthUser = async () => {
    try {
      const res = await fetch(`${API}/user-profile/`, { credentials: "include" });
      const data = await res.json();
      if (data.success && data.user) {
        const userObj = {
          ...data.user,
          is_paid: !!data.user.is_paid && data.user.subscription_status === "active"
        };
        setAuthUser(userObj);
        if (!userObj.is_paid) {
          localStorage.removeItem("smartbot_is_paid");
        }
      } else {
        setAuthUser(null);
      }
    } catch {
      setAuthUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => { fetchAuthUser(); }, []);

  // ── Access & Payment Status (Strict: Guest 3 chats, User 5 chats, Paid Unlimited) ─
  const [chatStatus, setChatStatus] = useState(() => {
    const hasSavedUser = !!localStorage.getItem("user_email");
    return {
      is_loading: true,
      is_authenticated: hasSavedUser,
      is_logged_in: hasSavedUser,
      is_paid: false,
      subscription_status: "inactive",
      remaining_chats: hasSavedUser ? 5 : 3,
      free_chats_remaining: hasSavedUser ? 5 : 3,
      guest_count: 0,
      user_count: 0,
      max_chats: hasSavedUser ? 5 : 3,
      limit_reached: false,
      login_required: false,
      payment_required: false,
      status_text: hasSavedUser ? "5 Free Chats" : "3 Free Chats"
    };
  });

  const fetchChatStatus = async () => {
    try {
      const res = await fetch(`${API}/chat-status/`, {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        const isAuth = !!(data.is_authenticated || data.is_logged_in);
        // STRICT: Only grant unlimited access if is_paid is true AND database subscription_status is 'active'
        const isPaid = !!data.is_paid && data.subscription_status === "active";

        if (isPaid) {
          localStorage.setItem("smartbot_is_paid", "true");
          setChatStatus({
            is_loading: false,
            is_authenticated: true,
            is_logged_in: true,
            is_paid: true,
            subscription_status: "active",
            remaining_chats: "unlimited",
            free_chats_remaining: "unlimited",
            guest_count: 0,
            user_count: 0,
            max_chats: "unlimited",
            limit_reached: false,
            login_required: false,
            payment_required: false,
            status_text: "Unlimited Access"
          });
        } else {
          // STRICT: An unpaid user must NEVER have a paid token in localStorage
          localStorage.removeItem("smartbot_is_paid");

          if (isAuth) {
            const userCount = typeof data.user_count === "number" ? data.user_count : 0;
            const remaining = typeof data.free_chats_remaining === "number"
              ? data.free_chats_remaining
              : (typeof data.remaining_chats === "number" ? data.remaining_chats : Math.max(0, 5 - userCount));
            const isLimit = remaining <= 0 || !!data.limit_reached || !!data.payment_required;

            setChatStatus({
              is_loading: false,
              is_authenticated: true,
              is_logged_in: true,
              is_paid: false,
              subscription_status: "inactive",
              user_count: userCount,
              guest_count: 0,
              max_chats: 5,
              remaining_chats: remaining,
              free_chats_remaining: remaining,
              limit_reached: isLimit,
              login_required: false,
              payment_required: isLimit,
              status_text: remaining > 0 ? `${remaining} Free Chats Remaining` : "Payment Required (₹599)"
            });
          } else {
            const localCount = parseInt(localStorage.getItem("smartbot_guest_messages_count") || "0", 10);
            const guestCount = Math.max(typeof data.guest_count === "number" ? data.guest_count : 0, localCount);
            const remaining = Math.max(0, 3 - guestCount);
            const isLimit = remaining <= 0 || !!data.limit_reached || !!data.login_required;

            setChatStatus({
              is_loading: false,
              is_authenticated: false,
              is_logged_in: false,
              is_paid: false,
              subscription_status: "none",
              guest_count: guestCount,
              user_count: 0,
              max_chats: 3,
              remaining_chats: remaining,
              free_chats_remaining: remaining,
              limit_reached: isLimit,
              login_required: isLimit,
              payment_required: false,
              status_text: remaining > 0 ? `${remaining} Free Chats` : "Login Required"
            });
          }
        }
      }
    } catch (err) {
      console.error("Error fetching chat status:", err);
      setChatStatus((prev) => ({ ...prev, is_loading: false }));
    }
  };

  useEffect(() => {
    fetchChatStatus();
  }, []);

  const addMessageToActiveChat = async (userText) => {
    let currentActiveId = activeChatId;

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

    // 1. Instantly display user prompt in chat
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

    // 2. Send to backend
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

      if (!data.success && (data.limit_reached || data.login_required || data.payment_required)) {
        await fetchChatStatus();
        return data;
      }

      if (data.success && data.bot_message) {
        const isError = typeof data.bot_message.text === "string" && (
          data.bot_message.text.includes("Sorry, I couldn't generate a response") ||
          data.bot_message.text.startsWith("Error:")
        );
        // Only increment guest counter in localStorage if truly an unauthenticated guest
        if (!chatStatus.is_paid && !chatStatus.is_logged_in && !chatStatus.is_authenticated && !isError) {
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
        return data;
      }
    } catch (err) {
      console.error("Error communicating with backend chatbot API:", err);
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
      await fetchChatStatus();
    }
  };

  // ── Theme State ────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("smartbot_theme") || "dark";
  });

  useEffect(() => {
    localStorage.setItem("smartbot_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
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
        theme,
        toggleTheme,
        authUser,
        authLoading,
        fetchAuthUser,
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
