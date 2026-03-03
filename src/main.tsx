import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Enregistrer le Service Worker pour PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW non supporté ou erreur, on continue silencieusement
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
