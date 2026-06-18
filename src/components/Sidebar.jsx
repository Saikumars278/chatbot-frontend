import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  const [open, setOpen] = useState(false);
  const [menuIndex, setMenuIndex] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [chats, setChats] = useState([
    "React chatbot workflow",
    "Login page design",
    "Signup page design",
    "API integration help",
    "Project setup guide",
  ]);

  const toggleMenu = (index) => {
    setUserMenuOpen(false);
    setMenuIndex(menuIndex === index ? null : index);
  };

  const handleDelete = (index) => {
    setChats(chats.filter((_, i) => i !== index));
    setMenuIndex(null);
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
              className={`chat-item ${menuIndex === index ? "menu-open" : ""}`}
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setMenuIndex(null);
                setUserMenuOpen(false);
              }}
            >
              <div className="chat-left">
                <span className="chat-icon">💬</span>
                <span className="chat-title">{chat}</span>
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
                      handleDelete(index);
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

          <div className="user-menu-wrapper">
            <div
              className={`user-box ${userMenuOpen ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setMenuIndex(null);
                setUserMenuOpen(!userMenuOpen);
              }}
            >
              <div className="user-avatar">D</div>

              <div>
                <h4>Dhanush</h4>
                <p>Free Plan</p>
              </div>

              <span className="user-arrow">{userMenuOpen ? "⌃" : "⌄"}</span>
            </div>

            {userMenuOpen && (
              <div
                className="user-dropdown"
                onClick={(e) => e.stopPropagation()}
              >
                <Link
                  to="/payment"
                  className="user-dropdown-link payment-link"
                  onClick={() => {
                    setOpen(false);
                    setMenuIndex(null);
                    setUserMenuOpen(false);
                  }}
                >
                  💳 Payment
                </Link>

                <Link
                  to="/login"
                  className="user-dropdown-link"
                  onClick={() => {
                    setOpen(false);
                    setMenuIndex(null);
                    setUserMenuOpen(false);
                  }}
                >
                  🚪 Logout
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;