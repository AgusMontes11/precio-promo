import { useEffect, useState } from "react";
import { ThemeContext } from "./ThemeContextBase";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
    const body = document.body;

    body.classList.remove("light-theme", "dark-theme");
    body.classList.add(theme === "dark" ? "dark-theme" : "light-theme");

    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
