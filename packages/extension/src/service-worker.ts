export {};

interface State {
  enabled: boolean;
  bypassUntil: number | null;
}

const state: State = {
  enabled: false,
  bypassUntil: null,
};

// Load state from storage on startup
chrome.storage.sync.get(["enabled", "bypassUntil"], (result) => {
  if (typeof result.enabled === "boolean") {
    state.enabled = result.enabled;
  }
  if (result.bypassUntil && result.bypassUntil > Date.now()) {
    state.bypassUntil = result.bypassUntil;
  }
  broadcast();
});

function getPublicState() {
  const bypassActive = state.bypassUntil !== null && state.bypassUntil > Date.now();
  const blocked = state.enabled && !bypassActive;

  return {
    enabled: state.enabled,
    blocked,
    bypassActive,
    bypassUntil: state.bypassUntil,
  };
}

function broadcast() {
  const publicState = getPublicState();
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: "STATE", ...publicState }).catch(() => {});
      }
    }
  });
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_STATE") {
    sendResponse(getPublicState());
    return true;
  }

  if (message.type === "TOGGLE") {
    state.enabled = !state.enabled;
    chrome.storage.sync.set({ enabled: state.enabled });
    broadcast();
    sendResponse(getPublicState());
    return true;
  }

  if (message.type === "ACTIVATE_BYPASS") {
    const today = new Date().toDateString();
    chrome.storage.sync.get(["lastBypassDate"], (result) => {
      if (result.lastBypassDate === today) {
        sendResponse({ success: false, reason: "Already used today" });
        return;
      }
      state.bypassUntil = Date.now() + 5 * 60 * 1000;
      chrome.storage.sync.set({ bypassUntil: state.bypassUntil, lastBypassDate: today });
      broadcast();
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === "GET_BYPASS_STATUS") {
    const today = new Date().toDateString();
    chrome.storage.sync.get(["lastBypassDate"], (result) => {
      sendResponse({
        usedToday: result.lastBypassDate === today,
        bypassActive: state.bypassUntil !== null && state.bypassUntil > Date.now(),
        bypassUntil: state.bypassUntil,
      });
    });
    return true;
  }

  return false;
});

// Check bypass expiry
setInterval(() => {
  if (state.bypassUntil && state.bypassUntil <= Date.now()) {
    state.bypassUntil = null;
    chrome.storage.sync.remove("bypassUntil");
    broadcast();
  }
}, 5000);
