import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { API_BASE_URL as API_BASE } from "../config";
import "./Sidebar.css";


function Sidebar({ open: propOpen, setOpen: propSetOpen }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = propOpen !== undefined ? propOpen : internalOpen;
  const setOpen = propSetOpen || setInternalOpen;
  const [menuIndex, setMenuIndex] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navigate = useNavigate();

  const { chats, activeChatId, createNewChat, deleteChat, selectChat, authUser, authLoading, fetchAuthUser, chatStatus, fetchChatStatus, clearAllChats, theme, toggleTheme } = useChat();

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
    localStorage.removeItem("smartbot_is_paid");
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
              setOpen(false);
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
                setOpen(false);
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
          <button
            type="button"
            className="sidebar-theme-toggle-btn"
            onClick={toggleTheme}
            title="Toggle Light/Dark Theme"
          >
            {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>

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
                🔑 Login
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
                ✨ Signup
              </Link>
            </>
          )}

          {/* Show logged in user profile section at the bottom */}
          {(authUser || (authLoading && localStorage.getItem("user_email"))) && (
            <div className="user-profile-section">
              <div className="user-profile-info">
                <div className="user-avatar">
                  {authUser?.avatar || localStorage.getItem("user_email")?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="user-details">
                  <h4>{authUser?.name || authUser?.username || localStorage.getItem("user_email")?.split("@")[0] || "User"}</h4>
                  <p className="user-email" title={authUser?.email || localStorage.getItem("user_email")}>
                    {authUser?.email || localStorage.getItem("user_email") || "Logged In"}
                  </p>
                  {(chatStatus?.is_paid || authUser?.is_paid) ? (
                    <p className="user-plan-badge unlimited">✨ Unlimited Access</p>
                  ) : (
                    <>
                      <p className="user-plan-badge">
                        Free Plan ({chatStatus?.remaining_chats !== undefined ? chatStatus.remaining_chats : 5} left)
                      </p>
                      <button
                        type="button"
                        className="sidebar-upgrade-link-btn"
                        onClick={() => navigate("/payment")}
                        title="Upgrade to Unlimited Access"
                      >
                        ⚡ Upgrade (Plans)
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="user-profile-actions">
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