import { createContext, useContext, useState, useEffect } from "react";

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [chats, setChats] = useState(() => {
    // Clear old localstorage dummy items once
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
      const response = await fetch("http://127.0.0.1:8000/api/messages/send/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: userText })
      });
      const data = await response.json();
      if (data.success && data.bot_message) {
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
        addMessageToActiveChat
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
