import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// --- PWA service worker registration with strict preview/iframe guards ---
// Service workers in Lovable's preview iframe cause stale content and
// navigation interference, so we never register there.
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const host = window.location.hostname;
const isPreviewHost =
  host.includes("id-preview--") ||
  host.includes("lovableproject.com") ||
  host.includes("lovable.dev");

if (isPreviewHost || isInIframe) {
  // Defensively unregister any SW that may have been installed in this context
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
  }
} else if ("serviceWorker" in navigator) {
  // Lazy import so the registration code is only pulled in when needed
  import("virtual:pwa-register")
    .then(({ registerSW }) => {
      registerSW({ immediate: true });
    })
    .catch(() => {
      /* no-op: PWA plugin not available (e.g. dev) */
    });
}

createRoot(document.getElementById("root")!).render(<App />);
