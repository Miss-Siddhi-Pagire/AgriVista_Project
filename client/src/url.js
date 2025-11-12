// src/url.js
let url;

if (window.location.hostname === "localhost") {
  // Local development (backend runs on 7000)
  url = "http://localhost:7000";
} else {
  // Production (Render, etc.)
  url = "https://cropmate.onrender.com";
}

export default url;
