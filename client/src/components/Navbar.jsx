import { useCookies } from "react-cookie";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import { FaMicrophone, FaBars, FaTimes } from "react-icons/fa"; // Added icons
// import LanguageSelector from "./LanguageSelector"; // Removed
import VoiceAssistant from "./VoiceAssistant"; // Import the component

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cookies, setCookie, removeCookie] = useCookies(["profilePhoto"]);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false); // State for modal
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile menu state

  useEffect(() => {
    const initTranslate = () => {
      if (window.google && window.google.translate && window.google.translate.TranslateElement) {
        const element = document.getElementById("google_translate_element");
        if (element) {
          element.innerHTML = ""; // Clear existing to prevent duplicate dropdowns
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'en,hi,mr,gu,pa,bn,kn,ta,te,ml',
              autoDisplay: false
            },
            'google_translate_element'
          );
        }
      }
    };

    window.googleTranslateElementInit = initTranslate;

    const scriptId = "google-translate-script";
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "text/javascript";
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      document.body.appendChild(script);
    } else {
      if (window.google && window.google.translate) {
        initTranslate();
      } else {
        const interval = setInterval(() => {
          if (window.google && window.google.translate) {
            initTranslate();
            clearInterval(interval);
          }
        }, 100);
        return () => clearInterval(interval);
      }
    }
  }, [location.pathname]);

  const username = Cookies.get("username") || "User";
  const initials = username.substring(0, 2).toUpperCase();

  const Logout = () => {
    removeCookie("token");
    removeCookie("language");
    Cookies.remove("id");
    Cookies.remove("token");
    Cookies.remove("language");
    Cookies.remove("username");
    Cookies.remove("profilePhoto");
    Cookies.remove("role");
    navigate("/login");
  };

  return (
    <nav className="navbar" style={{ paddingLeft: '4rem', paddingRight: '4rem' }}>
      <Link className="nav-logo" to="/home" style={{ textDecoration: 'none' }}>
        <div className="nav-logo-dot">🌿</div>AgriVista
      </Link>

      <ul className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        {[
          { name: "Market Hub", path: "/market" },
          { name: "Farmers Community", path: "/forum" },
          { name: "Season Planner", path: "/season-planner" },
          { name: "AI Insights", path: "/update" }
        ].map((link, idx) => (
          <li key={idx} onClick={() => setIsMobileMenuOpen(false)}>
            <Link
              className={location.pathname === link.path ? "nav-active" : ""}
              to={link.path}
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>

      <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div id="google_translate_element"></div>

        {/* Voice Assistant Trigger */}
        <button
          className="nav-btn-ghost"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            padding: 0,
            borderRadius: '50%'
          }}
          onClick={() => setShowVoiceAssistant(true)}
          title="Speak to AgriVoice"
        >
          <FaMicrophone size={16} />
        </button>

        <div className="dropdown">
          <button
            className="nav-avatar"
            type="button"
            data-bs-toggle="dropdown"
            style={{ border: 'none', padding: 0 }}
          >
            {cookies.profilePhoto ? (
              <img
                src={cookies.profilePhoto}
                alt="Profile"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : (
              initials
            )}
          </button>

          <ul
            className="dropdown-menu dropdown-menu-end border-0 shadow-lg mt-2"
            style={{
              borderRadius: "12px",
              minWidth: "210px",
              padding: "8px",
              backgroundColor: '#fff'
            }}
          >
            <li className="px-3 py-2 mb-1 rounded-3" style={{ backgroundColor: '#f9fef9' }}>
              <span className="text-muted d-block" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Farmer</span>
              <strong style={{ color: '#052e16', fontSize: "14px" }}>{username}</strong>
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

            <li>
              <button className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-2" onClick={() => navigate("/ledger")} style={{ fontSize: '14px' }}>
                <i className="bi bi-wallet2"></i> Farm Ledger
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
        
        {/* Hamburger Mobile Toggle */}
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          title="Toggle Navigation"
        >
          {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      <style>{`
        /* Google Translate Widget Customization */
        .goog-te-gadget {
            font-family: 'Outfit', sans-serif !important;
            font-size: 0px !important;
            color: transparent !important;
            display: flex;
            align-items: center;
        }
        
        .goog-te-gadget span {
            display: none !important;
        }
        
        /* AGGRESSIVE BANNER HIDING */
        body {
            top: 0px !important;
            position: static !important;
            margin-top: 0px !important;
        }
        .skiptranslate > iframe.goog-te-banner-frame {
            display: none !important;
            box-shadow: none !important;
        }
        body > .skiptranslate {
            display: none !important;
        }
        .goog-logo-link {
            display: none !important;
        }
        
        /* Fix translation widget visibility */
        .goog-te-gadget .goog-te-combo {
            margin: 0;
            padding: 4px 8px;
            border-radius: 6px;
            border: 1px solid rgba(74,222,128,0.4);
            background-color: #0a3d1f;
            color: #ffffff;
            font-family: 'Outfit', sans-serif;
            font-size: 13px;
            outline: none;
            cursor: pointer;
        }
        .goog-te-gadget .goog-te-combo option {
            color: #000000;
            background-color: #ffffff;
        }
        .goog-te-gadget .goog-te-combo:focus {
            border-color: #16a34a;
        }
      `}</style>
      <VoiceAssistant
        show={showVoiceAssistant}
        handleClose={() => setShowVoiceAssistant(false)}
      />
    </nav>
  );
};

export default Navbar;