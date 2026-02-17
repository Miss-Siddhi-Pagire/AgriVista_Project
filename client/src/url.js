// src/url.js
let url;

if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {

  url = "http://localhost:7000";
} else {
  // Production (Render, etc.)
  url = "https://agrivista-backend.onrender.com";
}

export default url;
