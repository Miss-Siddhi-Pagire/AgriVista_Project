import React, { useEffect } from "react";
import { Globe } from "lucide-react";

const LanguageSelector = () => {
  useEffect(() => {
    const initGoogleTranslate = () => {
      if (window.google && window.google.translate && window.google.translate.TranslateElement) {
        const container = document.getElementById("google_translate_element");
        if (container) {
          if (!container.querySelector(".goog-te-combo")) {
            container.innerHTML = "";
            new window.google.translate.TranslateElement(
              {
                pageLanguage: "en",
                includedLanguages: "en,hi,mr,gu,pa,bn,kn,ta,te,ml",
                autoDisplay: false
              },
              "google_translate_element"
            );
          }
        }
      }
    };

    window.googleTranslateElementInit = initGoogleTranslate;

    const scriptId = "google-translate-script";
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "text/javascript";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    } else {
      if (window.google && window.google.translate) {
        initGoogleTranslate();
      } else {
        const checkInterval = setInterval(() => {
          if (window.google && window.google.translate) {
            initGoogleTranslate();
            clearInterval(checkInterval);
          }
        }, 150);
        setTimeout(() => clearInterval(checkInterval), 5000);
      }
    }

    // MutationObserver to permanently suppress Google top banner frame and body top displacement
    const suppressBanner = () => {
      if (document.body.style.top !== "0px" && document.body.style.top !== "") {
        document.body.style.top = "0px";
      }
      const bannerIframes = document.querySelectorAll(".goog-te-banner-frame, iframe[id*=':1.container'], iframe[id*=':2.container'], iframe[class*='goog'], iframe[class*='VIpgJd']");
      bannerIframes.forEach(iframe => {
        iframe.style.display = "none";
        iframe.style.visibility = "hidden";
        iframe.style.height = "0px";
        iframe.style.opacity = "0";
        iframe.style.pointerEvents = "none";
      });
    };

    const observer = new MutationObserver(() => {
      suppressBanner();
    });

    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true
    });

    const interval = setInterval(suppressBanner, 200);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="language-badge-container">
      <Globe size={16} className="lang-icon" />
      <span className="lang-label">Language</span>
      <div id="google_translate_element"></div>
      
      <style>{`
        .language-badge-container {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #064e3b;
          border: 1px solid rgba(74, 222, 128, 0.4);
          padding: 3px 10px;
          border-radius: 20px;
          color: #ffffff;
          font-family: 'Outfit', system-ui, sans-serif;
          font-size: 13px;
          font-weight: 500;
          height: 36px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: all 0.2s ease;
        }

        .language-badge-container:hover {
          background-color: #047857;
          border-color: #34d399;
        }

        .lang-icon {
          color: #34d399;
          flex-shrink: 0;
        }

        .lang-label {
          color: #ecfdf5;
          font-weight: 600;
          font-size: 13px;
          letter-spacing: 0.2px;
        }

        /* Container styling */
        #google_translate_element {
          display: inline-block;
          vertical-align: middle;
        }

        /* Hide ALL Google Translate icons, logos, branding, and text wrappers */
        .goog-te-gadget-icon,
        .goog-te-gadget img,
        img.goog-te-gadget-icon,
        .goog-logo-link,
        .goog-te-banner-frame,
        .goog-te-gadget > span,
        .goog-te-gadget > div > span,
        .goog-te-menu-value img,
        .goog-te-menu-value span:nth-child(3),
        .goog-te-menu-value span:nth-child(5) {
          display: none !important;
        }

        .goog-te-gadget {
          font-size: 0px !important;
          color: transparent !important;
          margin: 0 !important;
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
        }

        /* Aggressively suppress Google top banner and body shifting across all modern Google classes */
        html, body {
          top: 0px !important;
          position: static !important;
          margin-top: 0px !important;
        }

        .goog-te-banner-frame,
        iframe.goog-te-banner-frame,
        .VIpgJd-yA16dz-yfv1eb-SMwNsf,
        .VIpgJd-ZGain-Wef8fc-bV1wfc,
        .VIpgJd-ZGain-O42Bvf,
        #goog-gt-tt,
        .goog-te-balloon-frame,
        .goog-tooltip,
        .goog-tooltip:hover {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          height: 0 !important;
          width: 0 !important;
          pointer-events: none !important;
        }

        /* Style native select dropdown seamlessly inside our Language rectangle badge */
        .goog-te-gadget .goog-te-combo {
          margin: 0 !important;
          padding: 2px 6px !important;
          border-radius: 6px !important;
          border: none !important;
          background-color: transparent !important;
          color: #ffffff !important;
          font-family: 'Outfit', system-ui, sans-serif !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          outline: none !important;
          cursor: pointer !important;
          height: 28px !important;
        }

        .goog-te-gadget .goog-te-combo option {
          color: #0f172a !important;
          background-color: #ffffff !important;
          padding: 6px !important;
          font-size: 13px !important;
        }
      `}</style>
    </div>
  );
};

export default LanguageSelector;


