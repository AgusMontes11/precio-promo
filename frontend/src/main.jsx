// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import "./theme.css";


ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <React.StrictMode><App /></React.StrictMode>
  </AuthProvider>
);
