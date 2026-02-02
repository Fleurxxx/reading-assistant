import React from "react";
import ReactDOM from "react-dom/client";
import SettingsForm from "./SettingsForm";
import "../index.css";
import "./options.css";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <SettingsForm />
  </React.StrictMode>
);
