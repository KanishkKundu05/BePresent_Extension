export {};

const OVERLAY_ID = "bepresent-overlay";

interface PublicState {
  enabled: boolean;
  blocked: boolean;
  bypassActive: boolean;
}

let lastKnownState: PublicState | null = null;
let shouldBlock = false;

function isBlockablePage(): boolean {
  const hostname = window.location.hostname.replace(/^www\./, "");

  // Instagram: block reels
  if (hostname === "instagram.com" || hostname.endsWith(".instagram.com")) {
    return window.location.pathname.startsWith("/reels");
  }

  // X: block the whole feed
  if (hostname === "x.com" || hostname.endsWith(".x.com")) {
    return true;
  }

  // YouTube: block Shorts
  if (hostname === "youtube.com" || hostname.endsWith(".youtube.com")) {
    return window.location.pathname.startsWith("/shorts");
  }

  return false;
}

function getSiteName(): string {
  const hostname = window.location.hostname.replace(/^www\./, "");
  if (hostname === "x.com" || hostname.endsWith(".x.com")) return "X";
  if (hostname === "youtube.com" || hostname.endsWith(".youtube.com"))
    return "YouTube Shorts";
  return "Instagram Reels";
}

function getBlockMessage(): string {
  const site = getSiteName();
  return `${site} is blocked right now. Close this tab and get back to what matters.`;
}

function getOverlay(): HTMLElement | null {
  return document.getElementById(OVERLAY_ID);
}

function getShadow(): ShadowRoot | null {
  return getOverlay()?.shadowRoot ?? null;
}

function createOverlay(): void {
  if (getOverlay()) return;

  const container = document.createElement("div");
  container.id = OVERLAY_ID;
  const shadow = container.attachShadow({ mode: "open" });

  shadow.innerHTML = `
    <div style="all:initial;position:fixed;top:0;left:0;right:0;bottom:0;width:100vw;height:100vh;background:rgba(0,0,0,0.92);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',system-ui,sans-serif;font-size:16px;line-height:1.5;z-index:2147483647;-webkit-font-smoothing:antialiased;">
      <div style="all:initial;display:flex;flex-direction:column;align-items:center;max-width:420px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',system-ui,sans-serif;font-size:16px;line-height:1.5;-webkit-font-smoothing:antialiased;">
        <img id="logo" style="width:80px;height:80px;margin-bottom:28px;border-radius:18px;" />
        <div style="color:#fff;font-size:28px;font-weight:700;margin:0 0 12px;line-height:1.2;letter-spacing:-0.5px;">be present</div>
        <div id="block-msg" style="color:#888;font-size:16px;line-height:1.6;margin:0 0 32px;font-weight:normal;max-width:320px;">Loading...</div>
        <button id="bypass-btn" style="all:initial;padding:14px 28px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:12px;color:rgba(255,255,255,0.5);font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',system-ui,sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:all 0.2s;">
          5 min bypass (1x per day)
        </button>
      </div>
    </div>
  `;

  // Set logo and message
  const logo = shadow.getElementById("logo") as HTMLImageElement;
  if (logo) {
    logo.src = chrome.runtime.getURL("icon-128.png");
  }
  const blockMsg = shadow.getElementById("block-msg");
  if (blockMsg) {
    blockMsg.textContent = getBlockMessage();
  }

  // Wire up bypass button
  const bypassBtn = shadow.getElementById("bypass-btn");
  if (bypassBtn) {
    chrome.runtime.sendMessage({ type: "GET_BYPASS_STATUS" }, (status) => {
      if (status?.usedToday) {
        bypassBtn.textContent = "Bypass already used today";
        (bypassBtn as HTMLButtonElement).disabled = true;
        bypassBtn.style.opacity = "0.3";
        bypassBtn.style.cursor = "not-allowed";
      }
    });

    bypassBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "ACTIVATE_BYPASS" }, (response) => {
        if (response?.success) {
          removeOverlay();
        } else if (response?.reason) {
          bypassBtn.textContent = response.reason;
          (bypassBtn as HTMLButtonElement).disabled = true;
          bypassBtn.style.opacity = "0.3";
          bypassBtn.style.cursor = "not-allowed";
        }
      });
    });

    bypassBtn.addEventListener("mouseenter", () => {
      if (!(bypassBtn as HTMLButtonElement).disabled) {
        bypassBtn.style.background = "rgba(255,255,255,0.12)";
        bypassBtn.style.color = "rgba(255,255,255,0.7)";
      }
    });
    bypassBtn.addEventListener("mouseleave", () => {
      bypassBtn.style.background = "rgba(255,255,255,0.08)";
      bypassBtn.style.color = "rgba(255,255,255,0.5)";
    });
  }

  document.documentElement.appendChild(container);
}

function removeOverlay(): void {
  getOverlay()?.remove();
}

// Block scroll on the reels page
function blockReelsScroll(): void {
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
}

function unblockReelsScroll(): void {
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
}

// Watch for overlay removal and re-add it
function setupMutationObserver(): void {
  const observer = new MutationObserver(() => {
    if (shouldBlock && isBlockablePage() && !getOverlay()) {
      createOverlay();
      blockReelsScroll();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

// Handle state updates from service worker
function handleState(state: PublicState): void {
  lastKnownState = state;

  if (state.blocked && isBlockablePage()) {
    shouldBlock = true;
    createOverlay();
    blockReelsScroll();
  } else {
    shouldBlock = false;
    removeOverlay();
    unblockReelsScroll();
  }
}

// Request state from service worker
function requestState(): void {
  chrome.runtime.sendMessage({ type: "GET_STATE" }, (response) => {
    if (chrome.runtime.lastError || !response) {
      setTimeout(requestState, 500);
      return;
    }
    handleState(response);
  });
}

// Listen for broadcasts from service worker
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "STATE") {
    handleState(message);
  }
});

// Watch for SPA navigation (Instagram is an SPA)
let lastPath = window.location.pathname;
const pathObserver = new MutationObserver(() => {
  if (window.location.pathname !== lastPath) {
    lastPath = window.location.pathname;
    if (lastKnownState) {
      handleState(lastKnownState);
    }
  }
});

function init(): void {
  setupMutationObserver();
  requestState();

  // Observe DOM changes to detect SPA navigation
  if (document.body) {
    pathObserver.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      pathObserver.observe(document.body, { childList: true, subtree: true });
    });
  }
}

init();
