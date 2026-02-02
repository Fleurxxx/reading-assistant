import React from "react";
import ReactDOM from "react-dom/client";
import StatsView from "./StatsView";
import "../index.css";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <StatsView />
  </React.StrictMode>
);
