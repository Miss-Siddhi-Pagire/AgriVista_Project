// src/url.js
let url;

if (window.location.hostname === "localhost") {
 
  url = "http://localhost:7000";
} else {
  // Production (Render, etc.)
  url = "https://cropmate.onrender.com";
}

export default url;
