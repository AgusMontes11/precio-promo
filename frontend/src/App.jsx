// src/App.jsx
import { BrowserRouter } from "react-router-dom";
import AppShell from "./AppShell";
import { useEffect } from "react";


export default function App() {

  useEffect(() => {
  const savedTheme = localStorage.getItem("theme") || "light";
  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
  } else {
    document.body.classList.remove("dark-theme");
  }
}, []);

  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
