import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageSelector from "./LanguageSelector";

const Navbar = () => {
  const navigate = useNavigate();
  const [cookies, removeCookie] = useCookies();
  const { t } = useTranslation();

  const [selectedLanguage, setSelectedLanguage] = useState(
    Cookies.get("language") || "deff"
  );

  const username = Cookies.get("username") || "User";

  // Get first two letters (uppercase)
  const initials = username.substring(0, 2).toUpperCase();

  const Logout = () => {
    removeCookie("token");
    removeCookie("language");
    Cookies.remove("id");
    Cookies.remove("token");
    Cookies.remove("language");
    Cookies.remove("username");
    navigate("/login");
  };

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 999,
        backgroundColor: "#c9d4f8",
      }}
    >
      <nav
        className="navbar navbar-expand-lg"
        style={{
          backgroundColor: "#d5eeff",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          borderBottom: "1px solid #bcd2f2",
        }}
      >
        <div className="container-fluid">
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarTogglerDemo01"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarTogglerDemo01">
            {/* Brand */}
            <a className="navbar-brand fw-bold" href="/Landing">
              {t("Title")}
            </a>

            {/* Nav Links */}
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <a className="nav-link" href="/">
                  {t("NHome")}
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/update">
                  {t("NUpdate")}
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/forum">
                  {t("NForum")}
                </a>
              </li>
            </ul>

            {/* Right Section */}
            <div className="d-flex align-items-center gap-3">
              {/* Language Selector */}
              <div style={{ width: "110px" }}>
                <LanguageSelector
                  selectedLanguage={selectedLanguage}
                  setSelectedLanguage={setSelectedLanguage}
                />
              </div>

              {/* Profile Initials Dropdown */}
              <div className="dropdown">
                <button
                  className="btn p-0 border-0 bg-transparent"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ outline: "none" }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      backgroundColor: "#4f6bed",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "600",
                      fontSize: "15px",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    {initials}
                  </div>
                </button>

                <ul
                  className="dropdown-menu dropdown-menu-end shadow"
                  style={{
                    borderRadius: "12px",
                    minWidth: "180px",
                  }}
                >
                  <li className="px-3 py-2 text-muted small">
                    Welcome Back <br />
                    <strong>{username}</strong>
                  </li>

                  <li><hr className="dropdown-divider" /></li>

                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => navigate("/update-profile")}
                    >
                      Update Profile
                    </button>
                  </li>

                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => navigate("/your-data")}
                    >
                      Your Data
                    </button>
                  </li>

                  <li><hr className="dropdown-divider" /></li>

                  <li>
                    <button
                      className="dropdown-item text-danger"
                      onClick={Logout}
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
