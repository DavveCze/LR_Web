import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
// TypeScript may complain about side-effect CSS imports if no
// type declarations are present. Ignore the next line's error.
// @ts-ignore
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);