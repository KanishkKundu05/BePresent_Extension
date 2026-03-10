export {};

interface PopupState {
  enabled: boolean;
  blocked: boolean;
  bypassActive: boolean;
}

const toggleBtn = document.getElementById("toggle-btn") as HTMLButtonElement;
const toggleLabel = document.getElementById("toggle-label") as HTMLElement;
const toggleTrack = document.getElementById("toggle-track") as HTMLElement;
const toggleThumb = document.getElementById("toggle-thumb") as HTMLElement;
const statusText = document.getElementById("status-text") as HTMLElement;
const settingsBtn = document.getElementById("settings-btn") as HTMLButtonElement;

function updateUI(state: PopupState): void {
  if (state.enabled) {
    toggleLabel.textContent = "On";
    toggleTrack.classList.add("active");
    toggleThumb.classList.add("active");

    if (state.bypassActive) {
      statusText.textContent = "Bypass active";
      statusText.className = "status-text bypass";
    } else {
      statusText.textContent = "Feeds are blocked";
      statusText.className = "status-text blocking";
    }
  } else {
    toggleLabel.textContent = "Off";
    toggleTrack.classList.remove("active");
    toggleThumb.classList.remove("active");
    statusText.textContent = "Feeds are allowed";
    statusText.className = "status-text";
  }
}

function refreshState(): void {
  chrome.runtime.sendMessage({ type: "GET_STATE" }, (state: PopupState) => {
    if (state) {
      updateUI(state);
    }
  });
}

toggleBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "TOGGLE" }, (state: PopupState) => {
    if (state) {
      updateUI(state);
    }
  });
});

settingsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "STATE") {
    updateUI(message);
  }
});

refreshState();
