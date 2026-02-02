import React from "react";
import ReactDOM from "react-dom/client";
import "../index.css";
import "./sidepanel.css";
import App from "./App";

const root = document.getElementById("sidepanel-root");

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
