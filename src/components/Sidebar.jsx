import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import "./Sidebar.css";

// Full absolute URL so calls reach the Django backend (port 8000),
// not the Vite dev server (port 5173).
const API_BASE = "http://localhost:8000/api";

function Sidebar() {
  const [open, setOpen] = useState(false);
  const [menuIndex, setMenuIndex] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navigate = useNavigate();

  const { chats, activeChatId, createNewChat, deleteChat, selectChat, authUser, authLoading, fetchAuthUser, fetchChatStatus, clearAllChats } = useChat();

  const toggleMenu = (index) => {
    setUserMenuOpen(false);
    setMenuIndex(menuIndex === index ? null : index);
  };

  const handleDelete = (id, index) => {
    deleteChat(id);
    setMenuIndex(null);
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await fetch(`${API_BASE}/logout/`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed:", err);
    }

    localStorage.removeItem("smartbot_guest_messages_count");
    localStorage.removeItem("user_email");
    clearAllChats();
    await fetchAuthUser();
    await fetchChatStatus();
    setOpen(false);
    setMenuIndex(null);
    setUserMenuOpen(false);
    navigate("/login");
  };

  useEffect(() => {
    const hideMenus = () => {
      setMenuIndex(null);
      setUserMenuOpen(false);
    };

    document.addEventListener("click", hideMenus);

    return () => {
      document.removeEventListener("click", hideMenus);
    };
  }, []);

  return (
    <>
      <button
        className="mobile-menu-btn"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
          setMenuIndex(null);
          setUserMenuOpen(false);
        }}
      >
        ☰
      </button>

      {open && (
        <div
          className="sidebar-overlay"
          onClick={() => {
            setOpen(false);
            setMenuIndex(null);
            setUserMenuOpen(false);
          }}
        ></div>
      )}

      <aside className={`sidebar ${open ? "active" : ""}`}>
        <div className="sidebar-mobile-header">
          <h3>SmartBot</h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              setMenuIndex(null);
              setUserMenuOpen(false);
            }}
          >
            ✕
          </button>
        </div>

        <div className="sidebar-top">
          <button
            className="new-chat-btn"
            onClick={(e) => {
              e.stopPropagation();
              createNewChat();
              setMenuIndex(null);
              setUserMenuOpen(false);
            }}
          >
            + New Chat
          </button>
        </div>

        <div className="chat-list">
          <p className="section-title">Recent Chats</p>

          {chats.map((chat, index) => (
            <div
              className={`chat-item ${activeChatId === chat.id ? "active" : ""} ${menuIndex === index ? "menu-open" : ""}`}
              key={chat.id}
              onClick={(e) => {
                e.stopPropagation();
                selectChat(chat.id);
                setMenuIndex(null);
                setUserMenuOpen(false);
              }}
            >
              <div className="chat-left">
                <span className="chat-icon">💬</span>
                <span className="chat-title">{chat.title}</span>
              </div>

              <button
                type="button"
                className="chat-menu-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMenu(index);
                }}
              >
                ⋯
              </button>

              {menuIndex === index && (
                <div
                  className="chat-dropdown"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(chat.id, index);
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="sidebar-bottom">
          {/* Show Login/Signup only when there is no logged-in user */}
          {!authLoading && !authUser && (
            <>
              <Link
                to="/login"
                className="sidebar-link"
                onClick={() => {
                  setOpen(false);
                  setMenuIndex(null);
                  setUserMenuOpen(false);
                }}
              >
                Login
              </Link>

              <Link
                to="/signup"
                className="sidebar-link"
                onClick={() => {
                  setOpen(false);
                  setMenuIndex(null);
                  setUserMenuOpen(false);
                }}
              >
                Signup
              </Link>
            </>
          )}

          {/* Show real user section only when logged in */}
          {!authLoading && authUser && (
            <div className="user-profile-section">
              <div className="user-profile-info">
                <div className="user-avatar">{authUser.avatar}</div>
                <div className="user-details">
                  <h4>{authUser.name}</h4>
                  <p className="user-email" title={authUser.email}>{authUser.email}</p>
                  <p className="user-plan-badge">{authUser.plan}</p>
                </div>
              </div>
              <div className="user-profile-actions">
                <Link
                  to="/payment"
                  className="sidebar-action-btn payment-btn"
                  onClick={() => {
                    setOpen(false);
                    setMenuIndex(null);
                  }}
                >
                  💳 Upgrade
                </Link>
                <button
                  type="button"
                  className="sidebar-action-btn logout-btn"
                  onClick={handleLogout}
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;