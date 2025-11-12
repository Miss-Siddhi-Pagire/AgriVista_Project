import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import Cookies from 'js-cookie';
import { MdExitToApp } from "react-icons/md";
import { useState } from "react";
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

const Navbar = () => {
  const navigate = useNavigate();
  const [cookies, removeCookie] = useCookies();
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(Cookies.get('language') || 'deff');

  const Logout = () => {
    removeCookie("token");
    removeCookie("language");
    Cookies.remove('id');
    Cookies.remove('token');
    Cookies.remove('language');
    Cookies.remove('username');
    navigate("/login");
  };

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 999, // stays on top of everything
        backgroundColor: "#c9d4f8",
      }}
    >
      <nav
        className="navbar navbar-expand-lg"
        style={{
          marginTop: 0,
          
          backgroundColor: '#d5eeff',
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
            aria-controls="navbarTogglerDemo01"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarTogglerDemo01">
            <a className="navbar-brand fw-bold" href="/Landing">
              {t('Title')}
            </a>

            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <a className="nav-link" href="/">{t('NHome')}</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/update">{t('NUpdate')}</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/forum">{t('NForum')}</a>
              </li>
            </ul>

            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "110px" }}>
                <LanguageSelector
                  selectedLanguage={selectedLanguage}
                  setSelectedLanguage={setSelectedLanguage}
                />
              </div>
              <button
                onClick={Logout}
                className="btn btn-outline-transparent d-flex align-items-center"
                style={{ color: "#333", fontWeight: "500" }}
              >
                <MdExitToApp size={20} style={{ marginRight: "6px" }} /> {t('NLogout')}
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
