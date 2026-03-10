export {};

interface ExtensionState {
  enabled: boolean;
  blocked: boolean;
  bypassActive: boolean;
}

interface BypassStatus {
  usedToday: boolean;
  bypassActive: boolean;
  bypassUntil: number | null;
}

// Elements
const statusIndicator = document.getElementById("status-indicator") as HTMLElement;
const statusText = document.getElementById("status-text") as HTMLElement;
const powerBtn = document.getElementById("power-btn") as HTMLButtonElement;
const powerLabel = document.getElementById("power-label") as HTMLElement;
const powerTrack = document.getElementById("power-track") as HTMLElement;
const powerThumb = document.getElementById("power-thumb") as HTMLElement;
const bypassBtn = document.getElementById("bypass-btn") as HTMLButtonElement;
const bypassText = document.getElementById("bypass-text") as HTMLElement;
const bypassStatus = document.getElementById("bypass-status") as HTMLElement;

let bypassCountdown: ReturnType<typeof setInterval> | null = null;

// Update UI with extension state
function updateUI(state: ExtensionState): void {
  if (state.enabled) {
    statusIndicator.className = "status-indicator active";
    statusText.textContent = "Blocking Reels";
    powerLabel.textContent = "On";
    powerTrack.classList.add("active");
    powerThumb.classList.add("active");
  } else {
    statusIndicator.className = "status-indicator";
    statusText.textContent = "Inactive";
    powerLabel.textContent = "Off";
    powerTrack.classList.remove("active");
    powerThumb.classList.remove("active");
  }

  if (state.bypassActive) {
    statusIndicator.className = "status-indicator bypass";
    statusText.textContent = "Bypass Active";
  }
}

// Update bypass button state
function updateBypassButton(status: BypassStatus): void {
  if (bypassCountdown) {
    clearInterval(bypassCountdown);
    bypassCountdown = null;
  }

  if (status.bypassActive && status.bypassUntil) {
    bypassBtn.disabled = true;
    bypassBtn.classList.add("active");

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((status.bypassUntil! - Date.now()) / 1000));
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      bypassText.textContent = `Bypass Active \u00b7 ${minutes}:${seconds.toString().padStart(2, "0")}`;

      if (remaining <= 0) {
        if (bypassCountdown) clearInterval(bypassCountdown);
        refreshState();
      }
    };

    updateCountdown();
    bypassCountdown = setInterval(updateCountdown, 1000);
    bypassStatus.textContent = "Bypass will expire soon";
  } else if (status.usedToday) {
    bypassBtn.disabled = true;
    bypassBtn.classList.remove("active");
    bypassText.textContent = "Bypass Used Today";
    bypassStatus.textContent = "Resets at midnight";
  } else {
    bypassBtn.disabled = false;
    bypassBtn.classList.remove("active");
    bypassText.textContent = "Activate Bypass";
    bypassStatus.textContent = "5 minutes of unblocked access, once per day";
  }
}

// Refresh state from service worker
function refreshState(): void {
  chrome.runtime.sendMessage({ type: "GET_STATE" }, (state: ExtensionState) => {
    if (state) {
      updateUI(state);
    }
  });

  chrome.runtime.sendMessage({ type: "GET_BYPASS_STATUS" }, (status: BypassStatus) => {
    if (status) {
      updateBypassButton(status);
    }
  });
}

// Event listeners
powerBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "TOGGLE" }, (state: ExtensionState) => {
    if (state) {
      updateUI(state);
    }
  });
});

bypassBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "ACTIVATE_BYPASS" }, (response) => {
    if (response?.success) {
      refreshState();
    } else if (response?.reason) {
      bypassStatus.textContent = response.reason;
    }
  });
});

// Listen for state broadcasts
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "STATE") {
    updateUI(message);
  }
});

// Initialize
refreshState();
setInterval(refreshState, 5000);
