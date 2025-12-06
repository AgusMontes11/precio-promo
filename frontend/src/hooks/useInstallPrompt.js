import { useState, useEffect } from "react";

export default function useInstallPrompt() {
  const [prompt, setPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault(); // necesario para controlar el banner nosotros
      setPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!prompt) return;

    prompt.prompt();
    const result = await prompt.userChoice;

    // oculta el banner inmediatamente después de elegir
    setPrompt(null);

    return result;
  };

  const clearPrompt = () => setPrompt(null);

  return { prompt, install, clearPrompt };
}
