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
  const initials = username.substring(0, 2).toUpperCase();

  const colors = {
    primaryGreen: "#6A8E23", 
    deepGreen: "#4A6317",
    creamBg: "#F9F8F3",
    textDark: "#2C3322",
    white: "#ffffff"
  };

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
        backgroundColor: colors.white,
      }}
    >
      <nav
        className="navbar navbar-expand-lg px-4"
        style={{
          backgroundColor: colors.white,
          boxShadow: "0 4px 15px rgba(74, 99, 23, 0.05)",
          borderBottom: `1px solid #e5e7eb`,
          minHeight: "60px", 
          paddingTop: "0.25rem",
          paddingBottom: "0.25rem"
        }}
      >
        <div className="container-fluid">
          <button
            className="navbar-toggler border-0 shadow-none"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarTogglerDemo01"
          >
            <span className="navbar-toggler-icon" style={{ width: '1.2em', height: '1.2em' }}></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarTogglerDemo01">
            {/* --- LOGO SECTION --- */}
            <a
              className="navbar-brand d-flex align-items-center gap-2"
              href="/Landing"
              style={{
                fontFamily: "serif", 
                fontSize: "20px",
                fontWeight: "700",
                color: colors.deepGreen,
                letterSpacing: "-0.5px",
                textDecoration: "none"
              }}
            >
              {/* Custom SVG Logo */}
              <div style={{
                width: "32px",
                height: "32px",
                backgroundColor: colors.creamBg,
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${colors.primaryGreen}33`
              }}>
                <svg 
                  width="22" 
                  height="22" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke={colors.primaryGreen} 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8a8 8 0 0 1-8 8Z" />
                  <path d="M13 22c0-3 0-4-3-6" />
                  <path d="M18 9c-2 1-3 1-5 0" />
                </svg>
              </div>
              <span>AgriVista</span>
            </a>

            <ul className="navbar-nav mx-auto gap-4">
              {[
                { name: t("NHome"), path: "/home" },
                { name: t("NUpdate"), path: "/update" },
                { name: t("NForum"), path: "/forum" }
              ].map((link, idx) => (
                <li className="nav-item" key={idx}>
                  <a 
                    className="nav-link px-0 position-relative hover-link" 
                    href={link.path}
                    style={{
                      color: colors.textDark,
                      fontWeight: "500",
                      fontSize: "14px",
                      transition: "color 0.3s ease",
                      padding: "5px 0"
                    }}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>

            <div className="d-flex align-items-center gap-3">
              <div style={{ width: "110px" }}>
                <LanguageSelector
                  selectedLanguage={selectedLanguage}
                  setSelectedLanguage={setSelectedLanguage}
                />
              </div>

              <div className="dropdown">
                <button
                  className="btn p-0 border-0 bg-transparent d-flex align-items-center"
                  type="button"
                  data-bs-toggle="dropdown"
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: colors.primaryGreen,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "600",
                      fontSize: "13px",
                      boxShadow: `0 4px 10px rgba(106, 142, 35, 0.2)`
                    }}
                  >
                    {initials}
                  </div>
                </button>

                <ul
                  className="dropdown-menu dropdown-menu-end border-0 shadow-lg mt-2"
                  style={{
                    borderRadius: "12px",
                    minWidth: "200px",
                    padding: "8px",
                    backgroundColor: colors.white
                  }}
                >
                  <li className="px-3 py-2 mb-1 rounded-3" style={{ backgroundColor: colors.creamBg }}>
                    <span className="text-muted d-block" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Gardener</span>
                    <strong style={{ color: colors.textDark, fontSize: "14px" }}>{username}</strong>
                  </li>

                  <li>
                    <button className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-2" onClick={() => navigate("/update-profile")} style={{ fontSize: '14px' }}>
                      <i className="bi bi-person"></i> Profile
                    </button>
                  </li>

                  <li>
                    <button className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-2" onClick={() => navigate("/your-data")} style={{ fontSize: '14px' }}>
                      <i className="bi bi-database"></i> History
                    </button>
                  </li>

                  <li><hr className="dropdown-divider opacity-10" /></li>

                  <li>
                    <button
                      className="dropdown-item text-danger d-flex align-items-center gap-2 py-2 rounded-2"
                      onClick={Logout}
                      style={{ fontSize: '14px' }}
                    >
                      <i className="bi bi-box-arrow-right"></i> Logout
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <style>{`
        .hover-link:hover {
          color: ${colors.primaryGreen} !important;
        }
        .hover-link::after {
          content: '';
          position: absolute;
          width: 0;
          height: 2px;
          bottom: 0;
          left: 0;
          background-color: ${colors.primaryGreen};
          transition: width 0.3s ease;
        }
        .hover-link:hover::after {
          width: 100%;
        }
        .dropdown-item:hover {
          background-color: ${colors.creamBg} !important;
          color: ${colors.deepGreen} !important;
        }
      `}</style>
    </div>
  );
};

export default Navbar;